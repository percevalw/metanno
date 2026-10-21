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
import { ErrorBanner } from "./source_view";

interface SourceSummary {
  name: string;
  // catalogue, files or databases
  kind: string;
  connection: string;
  connections: string[];
}

// Databases listed for a `databases` source, {} while listing, or the error of the listing
type ListedDatabases = SourceSummary[] | { error?: string };

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
  // Folder of annotations holding the file, eg a campaign with one file per annotator
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

// Open a Jupyter context menu at x, y with one entry per item, the menu is disposed once closed
function openMenu(items: { label: string; execute: () => void; isToggled?: () => boolean }[], x: number, y: number) {
  const commands = new CommandRegistry();
  const menu = new Menu({ commands });
  for (const item of items) {
    commands.addCommand(item.label, item);
    menu.addItem({ command: item.label });
  }
  menu.aboutToClose.connect(() => {
    window.setTimeout(() => menu.dispose(), 0);
  });
  menu.open(x, y);
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
        openMenu(
          [
            { label: "Open", execute: () => open(false) },
            ...(newTabs ? [{ label: "Open in new tab", execute: () => open(true) }] : []),
          ],
          event.clientX,
          event.clientY
        );
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
  const [tables, setTables] = useState<TableSummary[] | null>(null);
  const [listed, setListed] = useState<Record<string, ListedDatabases>>({});
  const [openDatabases, setOpenDatabases] = useState<string[]>([]);
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
        setListed({});
        setOpenDatabases([]);
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
  }, [configurationRevision]);
  const databasesOf = (name: string) => {
    const state = listed[name];
    return Array.isArray(state) ? state : [];
  };
  const listedSources = sources.flatMap((item) => databasesOf(item.name));
  const openConnection = [...sources, ...listedSources].find((item) => item.name === source)?.connection;
  // A `databases` source lists its databases on the first click only, there can be thousands of them
  const toggleDatabases = (name: string) => {
    const open = openDatabases.includes(name);
    if (listed[name] === undefined) listDatabases(name);
    setOpenDatabases((current) => (open ? current.filter((other) => other !== name) : [...current, name]));
  };
  function listDatabases(name: string) {
    setListed((current) => ({ ...current, [name]: {} }));
    void explorer
      .connect()
      .then((manager) => manager.request<{ sources: SourceSummary[] }>("list_databases", { source: name }))
      .then((reply) => setListed((current) => ({ ...current, [name]: reply.data.sources })))
      .catch((reason) =>
        setListed((current) => ({ ...current, [name]: { error: String(reason?.message ?? reason) } }))
      );
  }
  // Menu of the connections a database can be read with, the chosen one becomes its default in metanno.yaml
  const chooseConnection = (event: React.MouseEvent, item: SourceSummary) => {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    openMenu(
      item.connections.map((name) => ({
        label: name,
        isToggled: () => name === item.connection,
        execute: () =>
          void explorer
            .connect()
            .then((manager) => manager.request("set_source_connection", { source: item.name, connection: name }))
            .then(() =>
              setSources((current) =>
                current.map((other) => (other.name === item.name ? { ...other, connection: name } : other))
              )
            )
            .catch((reason) => setError(String(reason?.message ?? reason))),
      })),
      box.left,
      box.bottom
    );
  };
  useEffect(() => {
    let disposed = false;
    setTables(null);
    if (!source) return;
    void explorer
      .connect()
      .then((manager) => manager.request<{ tables: TableSummary[] }>("list_tables", { source }))
      .then((reply) => {
        if (!disposed) setTables(reply.data.tables);
      })
      .catch((error) => {
        if (!disposed) {
          setError(String(error));
          setTables([]);
        }
      });
    return () => {
      disposed = true;
    };
  }, [source, openConnection, configurationRevision]);
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

  // A database with its connection, and its tables once opened
  const sourceGroup = (item: SourceSummary) => (
    <section className="metanno-viewer__source-group" key={item.name}>
      <div className="metanno-viewer__source-row">
        <button
          className={`metanno-viewer__source${source === item.name ? " is-open" : ""}`}
          aria-expanded={source === item.name}
          onClick={() => {
            setSource(source === item.name ? null : item.name);
          }}
        >
          <span className="metanno-viewer__disclosure">{source === item.name ? "▾" : "▸"}</span>
          <span className="metanno-viewer__source-name">{item.name}</span>
        </button>
        {item.connections.length > 1 ? (
          <button
            className="metanno-viewer__connection"
            title="Connection used to read this database, click to change it"
            onClick={(event) => chooseConnection(event, item)}
          >
            {item.connection}
          </button>
        ) : (
          <span className="metanno-viewer__connection">{item.connection}</span>
        )}
      </div>
      {source === item.name && (
        <div className="metanno-viewer__tables">
          {tables === null && <div className="metanno-viewer__tables-empty">Loading tables…</div>}
          {tables?.length === 0 && <div className="metanno-viewer__tables-empty">No tables</div>}
          {(tables ?? [])
            .filter((itemTable) => matches(itemTable.name) || matches(item.name))
            .map((itemTable) => (
              <Entry
                key={itemTable.name}
                open={(newTab) => {
                  openResource({ kind: "table", source: item.name, table: itemTable.name }, newTab);
                }}
              >
                {itemTable.name}
              </Entry>
            ))}
        </div>
      )}
    </section>
  );
  // A `databases` source row, with its databases or the error of their listing under it once clicked
  const databasesGroup = (item: SourceSummary) => {
    const state = listed[item.name];
    const open = openDatabases.includes(item.name);
    return (
      <section className="metanno-viewer__source-group" key={item.name}>
        <div className="metanno-viewer__source-row">
          <button
            className={`metanno-viewer__source${open ? " is-open" : ""}`}
            aria-expanded={open}
            title={`Databases of the ${item.connection} connection`}
            onClick={() => toggleDatabases(item.name)}
          >
            <span className="metanno-viewer__disclosure">{open ? "▾" : "▸"}</span>
            <span className="metanno-viewer__source-name">{item.name}</span>
            {Array.isArray(state) && <small>{state.length} databases</small>}
          </button>
          <span className="metanno-viewer__connection">{item.connection}</span>
        </div>
        {open &&
          state !== undefined &&
          !Array.isArray(state) &&
          (state.error ? (
            <ErrorBanner
              text={state.error}
              onRetry={() => listDatabases(item.name)}
              onDismiss={() => {
                setOpenDatabases((current) => current.filter((other) => other !== item.name));
                setListed(({ [item.name]: _, ...rest }) => rest);
              }}
            />
          ) : (
            <div className="metanno-viewer__tables-empty">Listing databases…</div>
          ))}
        {open && Array.isArray(state) && (
          <div className="metanno-viewer__listed">
            {state.length === 0 && <div className="metanno-viewer__tables-empty">No databases with tables</div>}
            {state.filter((entry) => matches(entry.name) || entry.name === source).map(sourceGroup)}
          </div>
        )}
      </section>
    );
  };

  return (
    <>
      {error && (
        <ErrorBanner
          text={error}
          onRetry={() => {
            setError(null);
            setConfigurationRevision((value) => value + 1);
          }}
          onDismiss={() => setError(null)}
        />
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
                const path = "metanno-home/metanno.yaml";
                const contents = app.serviceManager.contents;
                try {
                  await contents.get(path, { content: false });
                } catch (error) {
                  if (!(error instanceof ServerConnection.ResponseError) || error.response.status !== 404) throw error;
                  await contents.save("metanno-home", { type: "directory" });
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
          .filter((item) => {
            // A databases source stays while one of its databases matches or is open, so the search also filters
            // the tables of the open database
            return (
              matches(item.name) ||
              item.name === source ||
              databasesOf(item.name).some((entry) => matches(entry.name) || entry.name === source)
            );
          })
          .map((item) => (item.kind === "databases" ? databasesGroup(item) : sourceGroup(item)))}
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
