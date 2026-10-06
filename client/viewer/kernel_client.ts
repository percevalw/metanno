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

export type SourceSelection =
  | { kind: "table"; source: string; table: string; title?: string }
  | { kind: "view"; name: string; title?: string };

// Rendered view sent by a kernel, with its recipe and the recipes the recipe selector of the tab offers
export type ViewReply = Parameters<IPretHost["render"]>[0] & {
  view_ref: string;
  view: string;
  choices: string[];
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
    const requestId = `data-${Date.now()}-${++this.sequence}`;
    const generation = this.generation;
    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        console.error("[Metanno] Request timed out", {
          method,
          requestId,
        });
        this.pending.delete(requestId);
        this.sendCancellation(requestId);
        reject(new Error(`${method} timed out`));
      }, timeoutMs);
      this.pending.set(requestId, { resolve, reject, timeout });
      try {
        this.comm!.send({
          protocol_version: PROTOCOL_VERSION,
          kind: "request",
          method,
          request_id: requestId,
          data,
        } as any);
      } catch (error) {
        window.clearTimeout(timeout);
        this.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
      if (generation !== this.generation) {
        window.clearTimeout(timeout);
        this.pending.delete(requestId);
        reject(new Error("Data kernel changed while sending request"));
      }
    }) as Promise<CommReply<T>>;
  }

  async cancelRequest(requestId: string): Promise<boolean> {
    const reply = await this.request<{ cancelled: boolean }>("cancel", { request_id: requestId }, 5000);
    return reply.data.cancelled;
  }

  subscribeEvents(listener: (message: CommMessage<Record<string, unknown>>) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private sendCancellation(requestId: string): void {
    if (!this.comm) return;
    const cancelRequestId = `data-${Date.now()}-${++this.sequence}`;
    try {
      this.comm.send({
        protocol_version: PROTOCOL_VERSION,
        kind: "request",
        method: "cancel",
        request_id: cancelRequestId,
        data: { request_id: requestId },
      } as any);
    } catch (error) {
      console.warn("[Metanno] Could not cancel timed out request", {
        requestId,
        error,
      });
    }
  }

  dispose(): void {
    this.generation += 1;
    this.rejectPending("Data comm disposed");
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
        this.rejectPending("Data kernel comm closed");
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

  private rejectPending(message: string): void {
    for (const request of this.pending.values()) {
      window.clearTimeout(request.timeout);
      request.reject(new Error(message));
    }
    this.pending.clear();
  }
}

// Share one explorer session and comm between the catalogue and source views
export class ExplorerKernelConnection {
  readonly context: SessionContext;
  private ready: Promise<void> | null = null;
  private client: Promise<KernelClient> | null = null;

  constructor(private services: ServiceManager.IManager) {
    this.context = new SessionContext({
      sessionManager: services.sessions,
      specsManager: services.kernelspecs,
      path: ".metanno-viewer/data-panel",
      name: "Metanno Data Explorer",
      type: "console",
      kernelPreference: { shouldStart: false },
    });
    this.context.kernelChanged.connect(() => {
      void this.client?.then(
        (client) => client.dispose(),
        () => {}
      );
      this.client = null;
    });
  }

  async connect(): Promise<KernelClient> {
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
        if (!this.context.session?.kernel) await this.context.changeKernel({ name: "metanno-explorer" });
        if (this.context.session?.kernel?.name !== "metanno-explorer")
          throw new Error("The Metanno data explorer session is using another kernel");
      })();
      this.ready.catch(() => {
        this.ready = null;
      });
    }
    await this.ready;
    if (!this.client) {
      this.client = (async () => {
        const client = new KernelClient(this.context.session!.kernel!);
        await client.connect();
        // The kernel reads the metanno.yaml at the root of the file browser, the one Open configuration edits
        await client.request("set_root", { root: PageConfig.getOption("serverRoot") });
        return client;
      })();
      const pending = this.client;
      pending.catch(() => {
        if (this.client === pending) this.client = null;
      });
    }
    return this.client;
  }
}
