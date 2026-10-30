import { SessionContext } from "@jupyterlab/apputils";
import { PageConfig } from "@jupyterlab/coreutils";
import { Kernel, KernelMessage, ServiceManager } from "@jupyterlab/services";
import type { IPretHost } from "pret";

export const DATA_COMM_TARGET = "metanno.viewer";
export const PROTOCOL_VERSION = 1;

export type MessageKind = "request" | "response" | "event";

export interface CommMessage<T = unknown> {
  protocol_version: 1;
  kind: MessageKind;
  method: string;
  request_id?: string;
  data: T;
}

// A table of a source, read with connection or the source default, or a saved view
export type SourceSelection =
  | { kind: "table"; source: string; table: string; connection?: string; title?: string }
  | { kind: "view"; name: string; title?: string }
  | { kind: "recipe"; name: string; tables?: Record<string, TablePick>; title?: string };

// A table picked for a Store key of a recipe in RecipeForm, sent to open_recipe_view
export type TablePick = { source: string; table: string; connection?: string };

// A parameter of a recipe main function, see recipe_parameters: its field kind, default value, the choices of a
// Literal or Enum, and the table whose columns a Column parameter offers
export type RecipeParameter = {
  name: string;
  kind: "text" | "integer" | "number" | "boolean" | "choice" | "column" | "json";
  required: boolean;
  default: unknown;
  choices: unknown[] | null;
  table: string | null;
  description: string;
};

// Table pickers and parameter fields sent by the kernel instead of a view when a recipe reads Store keys the view has
// no table for, or lacks a valid value for one of its parameters: the description and keywords of each key, the
// tables the view already has, the parameters with their current values, and the errors of those values
export type RecipeFormData = {
  recipe: string;
  tables: Record<string, { description: string; keywords: string[] }>;
  current: Record<string, TablePick>;
  parameters: RecipeParameter[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
};

// A dataset given by its location, eg by an HDFS file browser extension, opened as the table of the source containing
// it, see SourceCatalog.resolve_path
export type PathSelection = { kind: "path"; uri: string; connection?: string; title?: string };

// Rendered view sent by a kernel, with its recipe and the recipes the recipe selector of the tab offers
export type ViewReply = Parameters<IPretHost["render"]>[0] & {
  view_ref: string;
  view: string;
  choices: string[];
  // Connection of the tables of the view, null when they use different ones, and the connections they can all use
  connection?: string | null;
  connections?: string[];
  form?: RecipeFormData;
  // Seconds spent by kernel steps, logged when diagnosing slow view openings
  timings?: Record<string, number>;
};

interface PendingRequest {
  resolve: (value: CommReply<any>) => void;
  reject: (reason: Error) => void;
  timeout: number;
}

export interface CommReply<T = unknown> {
  data: T;
}

// Rejection of the requests still waiting when their kernel restarted, ExplorerKernelConnection.request sends them again
export class KernelRestartedError extends Error {
  constructor() {
    super("The Metanno kernel restarted");
  }
}

export class KernelClient {
  private comm: Kernel.IComm | null = null;
  private pending = new Map<string, PendingRequest>();
  private sequence = 0;
  private generation = 0;
  private eventListeners = new Set<(message: CommMessage<Record<string, unknown>>) => void>();

  constructor(private kernel: Kernel.IKernelConnection, private target = DATA_COMM_TARGET) {}

  async connect(): Promise<void> {
    this.generation += 1;
    const generation = this.generation;
    let reply: KernelMessage.ICommInfoReplyMsg;
    try {
      reply = await this.kernel.requestCommInfo({ target_name: this.target });
    } catch (reason) {
      console.warn("[Metanno] Retrying comm discovery", {
        kernelId: this.kernel.id,
        connectionStatus: this.kernel.connectionStatus,
        reason,
      });
      await this.kernel.reconnect();
      reply = await this.kernel.requestCommInfo({ target_name: this.target });
    }
    if (generation !== this.generation) {
      return;
    }
    if (this.target === DATA_COMM_TARGET && reply.content.status === "ok") {
      const commId = Object.keys(reply.content.comms)[0];
      if (commId) {
        this.attach(this.kernel.createComm(this.target, commId));
      }
    }
    if (!this.comm) {
      const comm = this.kernel.createComm(this.target);
      this.attach(comm);
      comm.open({ protocol_version: PROTOCOL_VERSION });
    }
    await this.request("is_alive", {}, 5000);
  }

  request<T = Record<string, unknown>>(
    method: string,
    data: Record<string, unknown>,
    timeoutMs = 120000
  ): Promise<CommReply<T>> {
    if (!this.comm) {
      return Promise.reject(new Error("Metanno comm is not connected"));
    }
    return new Promise((resolve, reject) => {
      const requestId = this.send(method, data);
      const timeout = window.setTimeout(() => {
        console.error("[Metanno] Request timed out", {
          method,
          requestId,
        });
        this.pending.delete(requestId);
        try {
          if (this.comm) this.send("cancel", { request_id: requestId });
        } catch (error) {
          console.warn("[Metanno] Could not cancel timed out request", {
            requestId,
            error,
          });
        }
        reject(new Error(`${method} timed out`));
      }, timeoutMs);
      this.pending.set(requestId, { resolve, reject, timeout });
    }) as Promise<CommReply<T>>;
  }

  subscribeEvents(listener: (message: CommMessage<Record<string, unknown>>) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  // Send a request on the comm and return its id, which the kernel puts in its response
  private send(method: string, data: Record<string, unknown>): string {
    const requestId = `data-${Date.now()}-${++this.sequence}`;
    this.comm!.send({
      protocol_version: PROTOCOL_VERSION,
      kind: "request",
      method,
      request_id: requestId,
      data,
    } as any);
    return requestId;
  }

  dispose(reason: Error = new Error("Data comm disposed")): void {
    this.generation += 1;
    this.rejectPending(reason);
    // Kernel restarts can dispose the comm before its view is released
    if (this.comm && !this.comm.isDisposed && !this.kernel.isDisposed) this.comm.close();
    else this.comm?.dispose();
    this.comm = null;
  }

  private attach(comm: Kernel.IComm): void {
    this.comm = comm;
    comm.onMsg = (message) => this.handleMessage(message);
    comm.onClose = () => {
      if (this.comm === comm) {
        console.warn("[Metanno] Comm closed", {
          kernelId: this.kernel.id,
          commId: comm.commId,
        });
        this.comm = null;
        this.rejectPending(new Error("Data kernel comm closed"));
      }
    };
  }

  private handleMessage(message: KernelMessage.ICommMsgMsg): void {
    const envelope = message.content.data as unknown as CommMessage<Record<string, unknown>>;
    if (envelope.protocol_version !== PROTOCOL_VERSION) {
      return;
    }
    if (envelope.kind === "event") {
      for (const listener of this.eventListeners) listener(envelope);
      return;
    }
    if (envelope.kind !== "response") return;
    const pending = envelope.request_id ? this.pending.get(envelope.request_id) : undefined;
    if (!pending || !envelope.request_id) {
      console.warn("[Metanno] Response has no pending request", {
        method: envelope.method,
        requestId: envelope.request_id,
      });
      return;
    }
    this.pending.delete(envelope.request_id);
    window.clearTimeout(pending.timeout);
    const error = envelope.data?.error as { message?: string } | undefined;
    if (error) {
      console.error("[Metanno] Request failed", {
        method: envelope.method,
        requestId: envelope.request_id,
        error,
      });
      pending.reject(new Error(error.message || "Data request failed"));
      return;
    }
    pending.resolve({ data: envelope.data });
  }

  private rejectPending(reason: Error): void {
    for (const request of this.pending.values()) {
      window.clearTimeout(request.timeout);
      request.reject(reason);
    }
    this.pending.clear();
  }
}

// Console session at `path` that starts no kernel by itself, callers then attach to a running kernel or choose one
export function createSession(services: ServiceManager.IManager, path: string, name: string): SessionContext {
  return new SessionContext({
    sessionManager: services.sessions,
    specsManager: services.kernelspecs,
    path,
    name,
    type: "console",
    kernelPreference: { shouldStart: false },
  });
}

// Share one explorer session and comm between the catalogue and source views
export class ExplorerKernelConnection {
  readonly context: SessionContext;
  private ready: Promise<void> | null = null;
  private client: Promise<KernelClient> | null = null;
  // Client once it reached the kernel, a "starting" status after that comes from a new kernel process
  private connected: KernelClient | null = null;
  private starting: Promise<unknown> | null = null;
  // Listings made by the sidebar, which open recipe forms add to their tables, see RecipeForm, and views saved by a
  // tab, which the sidebar lists again
  private listedListeners = new Set<(source: string, tables: { name: string; kind: string }[] | null) => void>();
  private viewsListeners = new Set<() => void>();

  // The sidebar reports the tables of each source or folder it lists (null for the databases of a source), so open
  // forms add them and retry the listings that failed before, e.g. a Trino source once its login is done
  reportListing(source: string, tables: { name: string; kind: string }[] | null): void {
    this.listedListeners.forEach((listener) => listener(source, tables));
  }

  onListing(listener: (source: string, tables: { name: string; kind: string }[] | null) => void): () => void {
    this.listedListeners.add(listener);
    return () => this.listedListeners.delete(listener);
  }

  // When a tab saves a view, the sidebar lists the saved views again so the new one shows under Explore
  reportViewsChanged(): void {
    this.viewsListeners.forEach((listener) => listener());
  }

  onViewsChanged(listener: () => void): () => void {
    this.viewsListeners.add(listener);
    return () => this.viewsListeners.delete(listener);
  }

  constructor(private services: ServiceManager.IManager) {
    this.context = createSession(services, ".metanno-viewer/data-panel", "Metanno Data Explorer");
    this.context.kernelChanged.connect(() => this.disposeClient());
    // A restarted kernel lost its comms: a restart from JupyterLab reports "restarting", one by the server, e.g. from
    // another tab, or after its process died only reports "starting"
    this.context.statusChanged.connect((_, status) => {
      if (status === "restarting" || status === "autorestarting" || (status === "starting" && this.connected))
        this.disposeClient();
    });
  }

  // Send a request to the explorer kernel, starting it unless start is false, and send it again on the new kernel when
  // a restart lost it, e.g. the sidebar listings sent while the server restarts the kernel
  async request<T = Record<string, unknown>>(
    method: string,
    data: Record<string, unknown>,
    timeoutMs?: number,
    start = true
  ): Promise<CommReply<T>> {
    try {
      return await (await this.connect(start)).request<T>(method, data, timeoutMs);
    } catch (error) {
      if (!(error instanceof KernelRestartedError)) throw error;
      return (await this.connect(start)).request<T>(method, data, timeoutMs);
    }
  }

  private disposeClient(): void {
    this.connected = null;
    void this.client?.then(
      (client) => client.dispose(new KernelRestartedError()),
      () => {}
    );
    this.client = null;
  }

  // Only the sidebar and Refresh buttons start a kernel, table tabs wait for one with start set to false
  async connect(start = true): Promise<KernelClient> {
    if (!this.ready) {
      this.ready = (async () => {
        await this.services.kernelspecs.refreshSpecs();
        if (!this.services.kernelspecs.specs?.kernelspecs["metanno-explorer"])
          throw new Error(
            "The Jupyter server cannot find the Metanno Data Explorer kernel. " +
              "In the Python environment with Metanno and your database drivers, run " +
              "python -m metanno.viewer.explorer_kernel --install, then click Retry. " +
              "Open configuration and existing application openers remain available."
          );
        await this.context.initialize();
      })();
      this.ready.catch(() => {
        this.ready = null;
      });
    }
    await this.ready;
    // A session shut down from the Running panel is noticed at once instead of at the next poll of the server
    if (start) await this.services.sessions.refreshRunning();
    // No kernel or a dead one, e.g. after a shutdown from the Running panel
    const kernel = this.context.session?.kernel;
    if (!kernel || kernel.isDisposed || kernel.status === "dead") {
      if (!start) throw new Error("Metanno is stopped, click Refresh to start it");
      if (!this.starting) {
        this.disposeClient();
        this.starting = this.context.changeKernel({ name: "metanno-explorer" }).finally(() => {
          this.starting = null;
        });
      }
      await this.starting;
    }
    if (this.context.session?.kernel?.name !== "metanno-explorer")
      throw new Error("The Metanno data explorer session is using another kernel");
    if (!this.client) {
      this.client = (async () => {
        const client = new KernelClient(this.context.session!.kernel!);
        await client.connect();
        // The kernel reads metanno-home/metanno.yaml at the root of the file browser, the one Open configuration edits
        await client.request("set_root", { root: PageConfig.getOption("serverRoot") });
        return client;
      })();
      const pending = this.client;
      pending.then(
        (client) => {
          if (this.client === pending) this.connected = client;
        },
        () => {
          if (this.client === pending) this.client = null;
        }
      );
    }
    return this.client;
  }
}
