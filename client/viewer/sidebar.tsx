import React, { useEffect, useState } from "react";
import { JupyterFrontEnd } from "@jupyterlab/application";
import { ReactWidget } from "@jupyterlab/apputils";
import { ReadonlyPartialJSONObject } from "@lumino/coreutils";
import { Menu } from "@lumino/widgets";
import { Message } from "@lumino/messaging";
import { CommandRegistry } from "@lumino/commands";
import type { IPretService } from "pret";
import { openAnnotation } from "./recipe_view";
import { NotebookOutputs } from "./notebook_output";
import { ExplorerKernelConnection, SourceSelection } from "./kernel_client";
import { ViewerTabs } from "./tabs";
import { ServerConnection } from "@jupyterlab/services";
import { PageConfig } from "@jupyterlab/coreutils";
import { LabIcon } from "@jupyterlab/ui-components";

interface SourceSummary {
  name: string;
  kind: string;
}

interface TableSummary {
  name: string;
  source: string;
}

interface SavedViewSummary {
  name: string;
  tables: Record<string, { source: string; table: string }>;
  recipe: string;
  parameters: Record<string, unknown>;
  root?: string;
}

interface StoreSummary {
  name: string;
  // Folder of views/stores holding the file, eg a campaign with one file per annotator
  group: string | null;
  path: string;
  kernelspec?: string;
  recipe: string;
  error?: string;
}

interface ViewDirectories {
  views: string;
  stores: string;
}

// Keep entry actions available through both a button and the Jupyter context menu
function Entry({
  open,
  children,
  title,
  newTabs = true,
}: {
  open(newTab: boolean): void;
  children: React.ReactNode;
  title?: string;
  newTabs?: boolean;
}) {
  return (
    <div
      className="metanno-viewer__entry"
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const commands = new CommandRegistry();
        commands.addCommand("open", { label: "Open", execute: () => open(false) });
        commands.addCommand("new", { label: "Open in new tab", execute: () => open(true) });
        const menu = new Menu({ commands });
        menu.addItem({ command: "open" });
        if (newTabs) menu.addItem({ command: "new" });
        menu.aboutToClose.connect(() => {
          window.setTimeout(() => menu.dispose(), 0);
        });
        menu.open(event.clientX, event.clientY);
      }}
    >
      <button className="metanno-viewer__table" title={title} onClick={() => open(false)}>
        {children}
      </button>
      {newTabs && (
        <button
          className="metanno-viewer__entry-new"
          title="Open in new tab"
          aria-label="Open in new tab"
          onClick={() => open(true)}
        >
          ↗
        </button>
      )}
    </div>
  );
}

// Keep catalogue discovery and navigation state independent of the opened data tabs
function Catalogue({
  app,
  pretService,
  tabs,
  explorer,
  outputs,
}: {
  app: JupyterFrontEnd;
  pretService: IPretService;
  tabs: ViewerTabs;
  explorer: ExplorerKernelConnection;
  outputs: NotebookOutputs;
}) {
  const displayEntries = [...outputs.entries.values()];
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [views, setViews] = useState<SavedViewSummary[]>([]);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [viewDirectories, setViewDirectories] = useState<ViewDirectories | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [, updateEntries] = useState(0);
  const [configurationRevision, setConfigurationRevision] = useState(0);
  const [configurationBusy, setConfigurationBusy] = useState(false);
  useEffect(() => {
    let disposed = false;
    const update = () => updateEntries((value) => value + 1);
    outputs.changed.connect(update);
    void explorer
      .connect()
      .then(async (manager) => {
        const [catalogue, recipes] = await Promise.all([
          manager.request<{ sources: SourceSummary[] }>("list_sources", {}),
          manager.request<{ views: SavedViewSummary[]; stores: StoreSummary[]; directories: ViewDirectories }>(
            "list_views",
            { root: PageConfig.getOption("serverRoot") }
          ),
        ]);
        if (disposed) return;
        setSources(catalogue.data.sources);
        setViews(recipes.data.views);
        setStores(recipes.data.stores);
        // Paths relative to the Jupyter root, opened in the file browser
        setViewDirectories(recipes.data.directories);
      })
      .catch((error) => {
        if (!disposed) setError(String(error));
      });
    return () => {
      disposed = true;
      outputs.changed.disconnect(update);
    };
  }, [app, configurationRevision]);
  useEffect(() => {
    let disposed = false;
    setTables([]);
    if (!source) return;
    setTablesLoading(true);
    void explorer
      .connect()
      .then((manager) => manager.request<{ tables: TableSummary[] }>("list_tables", { source }))
      .then((reply) => {
        if (!disposed) {
          setTables(reply.data.tables);
          setTablesLoading(false);
        }
      })
      .catch((error) => {
        if (!disposed) {
          setError(String(error));
          setTablesLoading(false);
        }
      });
    return () => {
      disposed = true;
    };
  }, [app, source, configurationRevision]);
  const openResource = (resource: SourceSelection, newTab = false) => {
    void app.commands
      .execute("metanno-viewer:open-resource", { resource: resource as unknown as ReadonlyPartialJSONObject, newTab })
      .catch((error) => setError(String(error)));
  };
  const matches = (name: string) => name.toLowerCase().includes(search.toLowerCase());
  const notebookEntries = (readOnly: boolean) =>
    displayEntries
      .filter((entry) => entry.read_only === readOnly && matches(entry.title))
      .map((entry) => (
        <Entry
          key={entry.id}
          newTabs={readOnly}
          title={entry.path || entry.origin.notebook}
          open={(newTab) => void entry.open(newTab).catch((error) => setError(String(error)))}
        >
          {entry.title}
          <small>{entry.path || entry.origin.notebook}</small>
        </Entry>
      ));
  // Annotation files matching the search, those of a folder show under its name
  const visibleStores = stores.filter(
    (store) =>
      (matches(store.name) || (store.group !== null && matches(store.group))) &&
      !displayEntries.some((entry) => entry.path === store.path)
  );
  const storeEntry = (store: StoreSummary) => (
    <Entry
      key={store.path}
      newTabs={false}
      title={store.error || store.path}
      open={(newTab) => {
        if (store.error) {
          setError(store.error);
          return;
        }
        void openAnnotation(app, pretService, tabs, store.path, store, newTab).catch((reason) =>
          setError(String(reason))
        );
      }}
    >
      {store.name}
      {store.error ? <small>{store.error}</small> : null}
    </Entry>
  );

  return (
    <>
      {error && (
        <div className="metanno-viewer__error">
          <span>{error}</span>
          <button
            className="metanno-viewer__toolbar-button"
            onClick={() => {
              setError(null);
              setConfigurationRevision((value) => value + 1);
            }}
          >
            Retry
          </button>
          <button className="metanno-viewer__dismiss" aria-label="Dismiss error" title="Dismiss" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}
      <aside className="metanno-viewer__sidebar">
        <div className="metanno-viewer__configuration">
          <button
            className="metanno-viewer__folder-link"
            type="button"
            disabled={configurationBusy}
            onClick={async () => {
              setConfigurationBusy(true);
              try {
                // Use the ordinary file editor without starting a kernel
                const path = "metanno.yaml";
                const contents = app.serviceManager.contents;
                try {
                  await contents.get(path, { content: false });
                } catch (error) {
                  if (!(error instanceof ServerConnection.ResponseError) || error.response.status !== 404) throw error;
                  await contents.save(path, { type: "file", format: "text", content: "connections: {}\nsources: {}\n" });
                }
                await app.commands.execute("docmanager:open", { path, factory: "Editor" });
              } catch (error) {
                setError(String(error));
              } finally {
                setConfigurationBusy(false);
              }
            }}
          >
            Open configuration
          </button>
          <button
            className="metanno-viewer__toolbar-button"
            aria-label="Reload configuration"
            title="Reload configuration"
            type="button"
            disabled={configurationBusy}
            onClick={async () => {
              setConfigurationBusy(true);
              try {
                const manager = await explorer.connect();
                await manager.request("reload_configuration", {});
                setError(null);
                setSource(null);
                setConfigurationRevision((value) => value + 1);
              } catch (error) {
                setError(String(error));
              } finally {
                setConfigurationBusy(false);
              }
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M20 7v5h-5M20 12a8 8 0 1 0-2 5" />
            </svg>
          </button>
        </div>
        <div className="metanno-viewer__sidebar-title">Explore</div>
        <input
          className="metanno-viewer__search"
          aria-label="Search sources and tables"
          placeholder="Search sources and tables"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {notebookEntries(true)}
        <div className="metanno-viewer__views">
          {views
            .filter((view) => matches(view.name))
            .map((view) => (
              <Entry
                key={view.name}
                title={Object.values(view.tables)
                  .map((table) => `${table.source}.${table.table}`)
                  .join(", ")}
                open={(newTab) => {
                  openResource(
                    {
                      kind: "view",
                      name: view.name,
                    },
                    newTab
                  );
                }}
              >
                {view.name}
              </Entry>
            ))}
          {views.length === 0 && <div className="metanno-viewer__tables-empty">No saved views</div>}
          {viewDirectories && (
            <div className="metanno-viewer__view-links">
              <button
                className="metanno-viewer__folder-link"
                title={viewDirectories.views}
                onClick={() =>
                  void app.commands.execute("filebrowser:open-path", {
                    path: viewDirectories.views,
                  })
                }
              >
                Open views folder
              </button>
            </div>
          )}
        </div>
        {sources
          .filter((item) => matches(item.name) || item.name === source)
          .map((item) => (
            <section className="metanno-viewer__source-group" key={item.name}>
              <button
                className={`metanno-viewer__source${source === item.name ? " is-open" : ""}`}
                aria-expanded={source === item.name}
                onClick={() => {
                  setSource(source === item.name ? null : item.name);
                }}
              >
                <span className="metanno-viewer__disclosure">{source === item.name ? "▾" : "▸"}</span>
                <span>{item.name}</span>
              </button>
              {source === item.name && (
                <div className="metanno-viewer__tables">
                  {tablesLoading && <div className="metanno-viewer__tables-empty">Loading tables…</div>}
                  {!tablesLoading && tables.length === 0 && (
                    <div className="metanno-viewer__tables-empty">No tables</div>
                  )}
                  {tables
                    .filter((itemTable) => matches(itemTable.name) || matches(item.name))
                    .map((itemTable) => (
                      <Entry
                        key={itemTable.name}
                        open={(newTab) => {
                          openResource(
                            {
                              kind: "table",
                              source: item.name,
                              table: itemTable.name,
                            },
                            newTab
                          );
                        }}
                      >
                        {itemTable.name}
                      </Entry>
                    ))}
                </div>
              )}
            </section>
          ))}
        <div className="metanno-viewer__sidebar-title">Annotations</div>
        <div className="metanno-viewer__views">
          {visibleStores.filter((store) => !store.group).map(storeEntry)}
          {[...new Set(visibleStores.map((store) => store.group).filter(Boolean))].map((group: string) => {
            const open = !closedGroups.includes(group);
            return (
              <section className="metanno-viewer__source-group" key={group}>
                <button
                  className={`metanno-viewer__source${open ? " is-open" : ""}`}
                  aria-expanded={open}
                  onClick={() =>
                    setClosedGroups(open ? [...closedGroups, group] : closedGroups.filter((name) => name !== group))
                  }
                >
                  <span className="metanno-viewer__disclosure">{open ? "▾" : "▸"}</span>
                  <span>{group}</span>
                </button>
                {open && (
                  <div className="metanno-viewer__tables">
                    {visibleStores.filter((store) => store.group === group).map(storeEntry)}
                  </div>
                )}
              </section>
            );
          })}
          {stores.length === 0 && !displayEntries.some((entry) => !entry.read_only) && (
            <div className="metanno-viewer__tables-empty">No Annotations</div>
          )}
          {viewDirectories && (
            <button
              className="metanno-viewer__folder-link"
              title={viewDirectories.stores}
              onClick={() =>
                void app.commands.execute("filebrowser:open-path", {
                  path: viewDirectories.stores,
                })
              }
            >
              Open annotations folder
            </button>
          )}
        </div>
        {notebookEntries(false)}
      </aside>
    </>
  );
}

// Sidebar tab icon, a LabIcon since JupyterLab 4 draws tab icons as inline SVG, grays keep the former look
const metannoIcon = new LabIcon({
  name: "metanno:viewer",
  svgstr:
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="-0.5 -0.5 115 123">' +
    '<rect x="4" y="22" width="106" height="96" rx="8.64" fill="#e6e6e6" stroke="#8a8a8a" stroke-width="9"/>' +
    '<rect x="16" y="4" width="65" height="54" rx="4.86" fill="#ffffff" stroke="#8a8a8a" stroke-width="9"/></svg>',
});

export class DataSidebar extends ReactWidget {
  private opened = false;
  constructor(
    private app: JupyterFrontEnd,
    private pretService: IPretService,
    private tabs: ViewerTabs,
    private explorer: ExplorerKernelConnection,
    private outputs: NotebookOutputs
  ) {
    super();
    this.id = "metanno-viewer-sidebar";
    this.title.icon = metannoIcon;
    this.title.caption = "Metanno, Explore and Annotations";
    this.addClass("metanno-viewer-sidebar");
  }
  // Start source discovery when the sidebar is first opened
  protected onAfterShow(message: Message): void {
    super.onAfterShow(message);
    this.opened = true;
    this.update();
  }
  render(): JSX.Element | null {
    return this.opened ? (
      <Catalogue
        app={this.app}
        pretService={this.pretService}
        tabs={this.tabs}
        explorer={this.explorer}
        outputs={this.outputs}
      />
    ) : null;
  }
}
