import React, { useCallback, useEffect, useRef, useState } from "react";
import { InputDialog, ReactWidget } from "@jupyterlab/apputils";
import type { IPretHost, IPretService } from "pret";

import {
  ExplorerKernelConnection,
  KernelClient,
  RecipeFormData,
  SourceSelection,
  TablePick,
  ViewReply,
} from "./kernel_client";
import { fullscreenKey, FullscreenViews } from "./fullscreen";
import { RecipeForm } from "./recipe_form";

// Error message of the sidebar and table tabs with clickable links, e.g. a login link, and an optional Retry button
// Name of a table with its source, joined with / when the source name is a path, eg hdfs:///user/me/runs/notes,
// and with . otherwise, eg cohort.notes, for tab titles, query statuses and the sidebar
export function tableLabel(source: string, table: string) {
  return `${source}${source.endsWith("/") ? "" : source.includes("/") ? "/" : "."}${table}`;
}

// The text of an error with its links clickable, eg the login link of a Trino error, for ErrorBanner and the sidebar
export function errorText(text: string) {
  return text.split(/(https?:\/\/[^\s"')]+)/).map((part, index) =>
    index % 2 ? (
      <a key={index} href={part} target="_blank" rel="noreferrer">
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function ErrorBanner({
  text,
  onRetry,
  onDismiss,
}: {
  text: string;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="metanno-viewer__error">
      <span>{errorText(text)}</span>
      {onRetry && (
        <button className="metanno-viewer__toolbar-button" onClick={onRetry}>
          Retry
        </button>
      )}
      <button className="metanno-viewer__dismiss" aria-label="Dismiss error" title="Dismiss" onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}

interface SourceViewProps {
  explorer: ExplorerKernelConnection;
  pretService: IPretService;
  initialResource: SourceSelection;
  fullscreenButton: HTMLButtonElement;
}

function SourceView({ explorer, pretService, initialResource, fullscreenButton }: SourceViewProps) {
  const hostNodeRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<IPretHost | null>(null);
  const managerRef = useRef<KernelClient | null>(null);
  // Set by Refresh, the only tab action that starts a stopped explorer kernel
  const startRef = useRef(false);
  const activeQueryRef = useRef<string | null>(null);
  const viewRef = useRef<string | null>(null);
  const label =
    initialResource.title ||
    (initialResource.kind === "table"
      ? tableLabel(initialResource.source, initialResource.table)
      : initialResource.name);
  const [status, setStatus] = useState("Connecting to the Metanno data explorer kernel");
  const [error, setError] = useState<string | null>(null);
  const [kernelGeneration, setKernelGeneration] = useState(0);
  const [ready, setReady] = useState(false);
  // Recipe chosen in the selector, the selection recipe until then
  const [recipe, setRecipe] = useState<string | null>(null);
  // Recipe and tables picked in RecipeForm, which then replace the resource of the tab
  const [picked, setPicked] = useState<{
    recipe: string;
    tables: Record<string, TablePick>;
    parameters: Record<string, unknown>;
  } | null>(
    initialResource.kind === "recipe"
      ? { recipe: initialResource.name, tables: initialResource.tables ?? {}, parameters: {} }
      : null
  );
  // Table pickers the kernel asked for instead of a view
  const [form, setForm] = useState<RecipeFormData | null>(null);
  const [connection, setConnection] = useState<string | null>(null);
  const [shown, setShown] = useState<{
    view: string;
    choices: string[];
    connection?: string | null;
    connections?: string[];
  } | null>(null);

  const renderPretView = useCallback(
    async (reply: { data: ViewReply }, label: string) => {
      if (!hostNodeRef.current) return;
      if (!hostRef.current) hostRef.current = pretService.createHost(explorer.context, hostNodeRef.current);
      const started = performance.now();
      setStatus(`Loading display for ${label}`);
      // Check the data comm separately when PRET loading stalls after the view reply
      const loadingTimer = window.setTimeout(() => {
        console.warn("[Metanno] PRET display still loading", {
          label,
          elapsedMs: Math.round(performance.now() - started),
        });
      }, 10000);
      try {
        const host = hostRef.current;
        await host.render(reply.data);
        if (host !== hostRef.current) return;
        setStatus(label);
      } finally {
        window.clearTimeout(loadingTimer);
      }
    },
    [pretService, explorer]
  );

  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};
    // The table reopens when a kernel starts, e.g. from the sidebar, a tab never starts one unless Refresh is clicked
    const handleKernelChanged = () => setKernelGeneration((value) => value + 1);
    explorer.context.kernelChanged.connect(handleKernelChanged);
    setReady(false);
    void (async () => {
      try {
        const manager = await explorer.connect(startRef.current);
        startRef.current = false;
        if (disposed || !hostNodeRef.current) return;
        managerRef.current = manager;
        unsubscribe = manager.subscribeEvents((message) => {
          if (message.method !== "query_status") return;
          const data = message.data;
          // Include requests from the previous view because they share the same query worker
          if (data.view_ref !== viewRef.current) {
            return;
          }
          const operationId = String(data.operation_id || "");
          const queryTable = tableLabel(String(data.source), String(data.table));
          if (data.phase === "queued") {
            setStatus(`Waiting for query worker, ${queryTable}`);
          } else if (data.phase === "running") {
            activeQueryRef.current = operationId;
            setStatus(`Querying ${queryTable}`);
          } else if (data.phase === "completed") {
            if (activeQueryRef.current === operationId) activeQueryRef.current = null;
            setStatus(data.rows == null ? queryTable : `${queryTable}, ${data.rows} rows`);
          } else if (data.phase === "failed") {
            if (activeQueryRef.current === operationId) activeQueryRef.current = null;
            setStatus(`Query failed for ${queryTable}`);
          }
        });
        setReady(true);
      } catch (reason: any) {
        if (!disposed) {
          setError(String(reason?.message ?? reason));
          setStatus("Metanno is unavailable");
        }
      }
    })();
    return () => {
      disposed = true;
      unsubscribe();
      explorer.context.kernelChanged.disconnect(handleKernelChanged);
      hostRef.current?.dispose();
      hostRef.current = null;
      activeQueryRef.current = null;
      managerRef.current = null;
    };
  }, [explorer, kernelGeneration]);

  useEffect(() => {
    const manager = managerRef.current;
    if (!ready || !manager) return;
    let disposed = false;
    let openedRef: string | null = null;
    setError(null);
    setStatus(`Opening ${label}`);
    const id = crypto.randomUUID();
    viewRef.current = id;
    const method = picked
      ? "open_recipe_view"
      : initialResource.kind === "view"
      ? "open_saved_view"
      : "open_table_view";
    const params = picked
      ? {
          recipe: picked.recipe,
          tables: picked.tables,
          parameters: picked.parameters,
          view_ref: id,
          ...(connection ? { connection } : {}),
        }
      : {
          ...initialResource,
          view_ref: id,
          ...(recipe ? { recipe } : {}),
          ...(connection ? { connection } : {}),
        };
    setForm(null);
    void manager
      .request<ViewReply>(method, params, 30000)
      .then(async (reply) => {
        if (reply.data.form) {
          if (disposed) return;
          setForm(reply.data.form);
          setShown({ view: reply.data.view, choices: [...new Set([reply.data.view, ...reply.data.choices])] });
          setStatus(`${reply.data.form.recipe} recipe`);
          return;
        }
        openedRef = reply.data.view_ref;
        if (disposed) {
          if (openedRef) void manager.request("close_view", { view_ref: openedRef });
          return;
        }
        viewRef.current = openedRef;
        setShown({
          view: reply.data.view,
          choices: [...new Set([reply.data.view, ...reply.data.choices])],
          connection: reply.data.connection,
          connections: reply.data.connections,
        });
        await renderPretView(reply, label);
      })
      .catch((reason) => {
        if (!disposed) {
          console.error("[Metanno] PRET table view failed", {
            selection: initialResource,
            reason,
          });
          setError(String(reason?.message ?? reason));
          setStatus("Could not open table");
        }
      });
    return () => {
      disposed = true;
      hostRef.current?.dispose();
      hostRef.current = null;
      if (openedRef) void manager.request("close_view", { view_ref: openedRef });
      if (viewRef.current === id) viewRef.current = null;
    };
  }, [initialResource, recipe, picked, connection, ready, kernelGeneration, renderPretView]);

  return (
    <div className="metanno-viewer">
      <main className="metanno-viewer__content">
        <div className="metanno-viewer__status">
          <span>{status}</span>
          <label className="metanno-viewer__toolbar-label">
            Recipe:
            <select
              className="metanno-viewer__recipe"
              aria-label="View recipe"
              value={shown?.view ?? ""}
              disabled={!shown || shown.choices.length < 2}
              onChange={(event) => {
                // The selector keeps a recipe that fails to render, so choosing the previous one renders it again
                const recipe = event.target.value;
                if (picked) setPicked({ ...picked, recipe, parameters: {} });
                else setRecipe(recipe);
                setShown((current) => current && { ...current, view: recipe });
              }}
            >
              {(shown?.choices ?? []).map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          </label>
          {shown?.connections && shown.connections.length > 0 && (
            <label className="metanno-viewer__toolbar-label">
              Connection:
              {shown.connections.length > 1 || !shown.connection ? (
                <select
                  className="metanno-viewer__recipe"
                  aria-label="Connection"
                  value={shown.connection ?? ""}
                  onChange={(event) => {
                    const chosen = event.target.value;
                    setConnection(chosen);
                    setShown((current) => current && { ...current, connection: chosen });
                  }}
                >
                  {/* When the tables of a view use different connections, choosing one moves them all to it */}
                  {!shown.connection && (
                    <option value="" disabled>
                      Mixed
                    </option>
                  )}
                  {shown.connections.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{shown.connection}</span>
              )}
            </label>
          )}
          {viewRef.current && (
            <details className="metanno-viewer__copy-menu">
              <summary className="metanno-viewer__toolbar-button">Copy code</summary>
              <div>
                {[
                  ["annotation", "Prepare annotation"],
                  ["query", "Customize query"],
                ].map(([purpose, label]) => (
                  <button
                    key={purpose}
                    className="metanno-viewer__toolbar-button"
                    onClick={(event) => {
                      event.currentTarget.closest<HTMLDetailsElement>("details")!.open = false;
                      void managerRef
                        .current!.request<{ code: string }>("export_view_code", {
                          view_ref: viewRef.current,
                          purpose,
                        })
                        .then((reply) => navigator.clipboard.writeText(reply.data.code))
                        .catch((reason) => setError(String(reason)));
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </details>
          )}
          {viewRef.current && !form && (
            <button
              className="metanno-viewer__toolbar-button"
              onClick={async () => {
                // The open view with its recipe, tables and parameters becomes a file of metanno-home/views
                const result = await InputDialog.getText({
                  title: "Save view",
                  label: "Name of the view, saved in metanno-home/views and shown under Explore",
                  text: shown?.view ?? "",
                });
                if (!result.button.accept || !result.value) return;
                try {
                  await managerRef.current!.request("save_view", { view_ref: viewRef.current, name: result.value });
                  setStatus(`Saved as view ${result.value}`);
                  explorer.reportViewsChanged();
                } catch (reason: any) {
                  setError(String(reason?.message ?? reason));
                }
              }}
            >
              Save view
            </button>
          )}
          <button
            className="metanno-viewer__toolbar-button"
            onClick={() => {
              startRef.current = true;
              setKernelGeneration((value) => value + 1);
            }}
          >
            Refresh
          </button>
          <button
            className="metanno-viewer__toolbar-button"
            disabled={!activeQueryRef.current}
            onClick={() => {
              const operationId = activeQueryRef.current;
              if (!operationId) return;
              setStatus("Cancelling query");
              void managerRef.current?.request("cancel", { request_id: operationId }, 5000);
            }}
          >
            Cancel query
          </button>
          <span className="metanno-viewer__fullscreen-button" ref={(node) => node?.append(fullscreenButton)} />
        </div>
        {error && <ErrorBanner text={error} onDismiss={() => setError(null)} />}
        {form && managerRef.current && (
          <RecipeForm
            key={JSON.stringify(form)}
            explorer={explorer}
            manager={managerRef.current}
            form={form}
            onOpen={(tables, parameters) => setPicked({ recipe: form.recipe, tables, parameters })}
          />
        )}
        <div className="metanno-viewer__pret-host" ref={hostNodeRef} hidden={Boolean(form)} />
      </main>
    </div>
  );
}

export class SourceViewWidget extends ReactWidget {
  private fullscreenButton: HTMLButtonElement;
  constructor(
    private explorer: ExplorerKernelConnection,
    private pretService: IPretService,
    private initialResource: SourceSelection,
    private fullscreen: FullscreenViews
  ) {
    super();
    this.node.tabIndex = -1;
    this.id = `metanno-viewer-${crypto.randomUUID()}`;
    this.title.label =
      initialResource.title || (initialResource.kind === "table" ? initialResource.table : initialResource.name);
    this.title.closable = true;
    this.addClass("metanno-viewer-widget");
    this.fullscreenButton = fullscreen.register(this, () => fullscreenKey(initialResource));
  }

  render(): JSX.Element {
    return <SourceView explorer={this.explorer} pretService={this.pretService}
      initialResource={this.initialResource} fullscreenButton={this.fullscreenButton} />;
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.fullscreen.exit(this);
    super.dispose();
  }

  protected onCloseRequest(): void {
    this.dispose();
  }

  protected onActivateRequest(): void {
    this.node.focus();
  }
}
