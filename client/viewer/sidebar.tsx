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
import { LabIcon, settingsIcon } from "@jupyterlab/ui-components";
import { errorText, tableLabel } from "./source_view";

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
  // Path under the source uri for a file source, eg `runs/notes`
  name: string;
  source: string;
  // A folder of a file source lists its own datasets and subfolders once opened
  kind: "table" | "folder";
}

// Entries of an opened folder of a file source, {} while listing, or the error of the listing
type ListedFolder = TableSummary[] | { error?: string };

// Key of a folder of a file source in the folder states
const folderKey = (source: string, folder: string) => `${source}\n${folder}`;

// A recipe of metanno-home/recipes with the Store keys it reads, null when it does not declare them
interface RecipeSummary {
  name: string;
  tables: Record<string, { description: string; keywords: string[] }> | null;
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

// Indentation of a row or message at a nesting depth, read by the sidebar CSS
const depthStyle = (depth: number) => ({ "--depth": depth } as React.CSSProperties);

// One line of the sidebar tree, used by every item so they share height, indentation and hover: an arrow for the rows
// that expand, an empty arrow slot otherwise, the label, then the controls at the end of the row (connection, open in
// a new tab). The accessible name of the button is the label alone
function Row({
  depth,
  expanded,
  label,
  title,
  onClick,
  onContextMenu,
  children,
}: {
  depth: number;
  expanded?: boolean;
  label: string;
  title?: string;
  onClick(): void;
  onContextMenu?(event: React.MouseEvent): void;
  children?: React.ReactNode;
}) {
  return (
    <div className="metanno-viewer__row" style={depthStyle(depth)} onContextMenu={onContextMenu}>
      <button className="metanno-viewer__row-button" aria-expanded={expanded} title={title} onClick={onClick}>
        <span className="metanno-viewer__disclosure" aria-hidden="true">
          {expanded === undefined ? "" : expanded ? "▾" : "▸"}
        </span>
        <span className="metanno-viewer__label">{label}</span>
      </button>
      {children}
    </div>
  );
}

// A row that opens something, from its button, from the open in a new tab button shown on hover, or from the Jupyter
// context menu
function Entry({
  depth,
  label,
  open,
  title,
  newTabs = true,
}: {
  depth: number;
  label: string;
  open(newTab: boolean): void;
  title?: string;
  newTabs?: boolean;
}) {
  return (
    <Row
      depth={depth}
      label={label}
      title={title}
      onClick={() => open(false)}
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
      {newTabs && (
        <button
          className="metanno-viewer__row-new"
          title="Open in new tab"
          aria-label="Open in new tab"
          onClick={() => open(true)}
        >
          ↗
        </button>
      )}
    </Row>
  );
}

// A muted line in place of entries, eg while listing or when there are none, aligned with the labels of its depth
function Note({ depth, children }: { depth: number; children: React.ReactNode }) {
  return (
    <div className="metanno-viewer__message" style={depthStyle(depth)}>
      {children}
    </div>
  );
}

// An error across the sidebar width, under the row it concerns or at the top of the lists. The text wraps by words
// and keeps the line breaks of a trace, a long one is folded to a few lines until expanded
function SidebarError({ text, onRetry, onDismiss }: { text: string; onRetry?: () => void; onDismiss: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 400 || text.split("\n").length > 6;
  return (
    <div className="metanno-viewer__sidebar-error" role="alert">
      <div className={`metanno-viewer__sidebar-error-text${long && !expanded ? " is-folded" : ""}`}>
        {errorText(text)}
      </div>
      <div className="metanno-viewer__sidebar-error-actions">
        {long && <button onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Show more"}</button>}
        {onRetry && <button onClick={onRetry}>Retry</button>}
        <button aria-label="Dismiss error" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
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
  shown,
}: {
  app: JupyterFrontEnd;
  pretService: IPretService;
  tabs: ViewerTabs;
  explorer: ExplorerKernelConnection;
  outputs: NotebookOutputs;
  // Counts the times the sidebar was shown, sources are listed again each time, on a new kernel if the last one stopped
  shown: number;
}) {
  const displayEntries = [...outputs.entries.values()];
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [views, setViews] = useState<SavedViewSummary[]>([]);
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreSummary[]>([]);
  // Folder of metanno.yaml relative to the Jupyter root, metanno-home until the kernel says otherwise
  const [home, setHome] = useState("metanno-home");
  const [source, setSource] = useState<string | null>(null);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [tables, setTables] = useState<TableSummary[] | null>(null);
  // Error of the table listing of the open source, shown under its row, and a counter that Retry increments
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [tablesRevision, setTablesRevision] = useState(0);
  const [listed, setListed] = useState<Record<string, ListedDatabases>>({});
  const [openDatabases, setOpenDatabases] = useState<string[]>([]);
  const [folders, setFolders] = useState<Record<string, ListedFolder>>({});
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [, updateEntries] = useState(0);
  const [configurationRevision, setConfigurationRevision] = useState(0);
  // When a tab saves a view, we list the views again so it shows under Explore, without listing the sources again
  // nor closing the open ones
  useEffect(
    () =>
      explorer.onViewsChanged(
        () =>
          void explorer
            .request<{ views: SavedViewSummary[] }>("list_views", { root: PageConfig.getOption("serverRoot") })
            .then((reply) => setViews(reply.data.views))
            .catch((reason) => setError(String(reason?.message ?? reason)))
      ),
    [explorer]
  );
  const [configurationBusy, setConfigurationBusy] = useState(false);
  useEffect(() => {
    let disposed = false;
    const update = () => updateEntries((value) => value + 1);
    outputs.changed.connect(update);
    void (async () => {
      const [catalogue, listing] = await Promise.all([
        explorer.request<{ sources: SourceSummary[] }>("list_sources", {}),
        explorer.request<{
          views: SavedViewSummary[];
          stores: StoreSummary[];
          home: string;
          recipes: RecipeSummary[];
          recipes_error: string | null;
        }>("list_views", {
          root: PageConfig.getOption("serverRoot"),
        }),
      ]);
      if (disposed) return;
      setSources(catalogue.data.sources);
      setListed({});
      setOpenDatabases([]);
      setViews(listing.data.views);
      setRecipes(listing.data.recipes);
      setRecipesError(listing.data.recipes_error);
      setStores(listing.data.stores);
      setHome(listing.data.home);
    })().catch((error) => {
      if (!disposed) setError(String(error));
    });
    return () => {
      disposed = true;
      outputs.changed.disconnect(update);
    };
  }, [configurationRevision, shown]);
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
      .request<{ sources: SourceSummary[] }>("list_databases", { source: name })
      .then((reply) => {
        setListed((current) => ({ ...current, [name]: reply.data.sources }));
        explorer.reportListing(name, null);
      })
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
            .request("set_source_connection", { source: item.name, connection: name })
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
    setTablesError(null);
    setFolders({});
    setOpenFolders([]);
    if (!source) return;
    void explorer
      .request<{ tables: TableSummary[] }>("list_tables", { source })
      .then((reply) => {
        explorer.reportListing(source, reply.data.tables);
        if (!disposed) setTables(reply.data.tables);
      })
      .catch((error) => {
        if (!disposed) {
          setTablesError(String(error?.message ?? error));
          setTables([]);
        }
      });
    return () => {
      disposed = true;
    };
  }, [source, openConnection, configurationRevision, tablesRevision]);
  // A folder of a file source lists its datasets and subfolders on the first click only
  const toggleFolder = (sourceName: string, folder: string) => {
    const key = folderKey(sourceName, folder);
    const open = openFolders.includes(key);
    if (folders[key] === undefined) listFolder(sourceName, folder);
    setOpenFolders((current) => (open ? current.filter((other) => other !== key) : [...current, key]));
  };
  function listFolder(sourceName: string, folder: string) {
    const key = folderKey(sourceName, folder);
    setFolders((current) => ({ ...current, [key]: {} }));
    void explorer
      .request<{ tables: TableSummary[] }>("list_tables", { source: sourceName, folder })
      .then((reply) => {
        setFolders((current) => ({ ...current, [key]: reply.data.tables }));
        explorer.reportListing(sourceName, reply.data.tables);
      })
      .catch((reason) =>
        setFolders((current) => ({ ...current, [key]: { error: String(reason?.message ?? reason) } }))
      );
  }
  const openResource = (resource: SourceSelection, newTab = false) => {
    void app.commands
      .execute("metanno-viewer:open-resource", { resource: resource as unknown as ReadonlyPartialJSONObject, newTab })
      .catch((error) => setError(String(error)));
  };
  const matches = (name: string) => name.toLowerCase().includes(search.toLowerCase());
  // Views shown by notebook outputs, read only previews under Explore and editable annotations under Annotations
  const notebookEntries = (readOnly: boolean) =>
    displayEntries
      .filter((entry) => entry.read_only === readOnly && matches(entry.title))
      .map((entry) => (
        <Entry
          key={entry.id}
          depth={0}
          label={entry.title}
          newTabs={readOnly}
          title={entry.path || entry.origin.notebook}
          open={(newTab) => void entry.open(newTab).catch((error) => setError(String(error)))}
        />
      ));
  // Annotation files matching the search, those of a folder show under its name
  const visibleStores = stores.filter(
    (store) =>
      (matches(store.name) || (store.group !== null && matches(store.group))) &&
      !displayEntries.some((entry) => entry.path === store.path)
  );
  const storeEntry = (store: StoreSummary, depth: number) => (
    <Entry
      key={store.path}
      depth={depth}
      label={store.name}
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
    />
  );

  // A folder stays while the search matches it or one of the entries listed under it
  const shownEntry = (item: SourceSummary, entry: TableSummary): boolean => {
    if (matches(entry.name) || matches(item.name)) return true;
    const state = folders[folderKey(item.name, entry.name)];
    return entry.kind === "folder" && Array.isArray(state) && state.some((child) => shownEntry(item, child));
  };
  // Tables and folders of a source at a depth, a folder shows its own entries under it once opened
  const sourceEntries = (item: SourceSummary, entries: TableSummary[], depth: number): React.ReactNode[] =>
    entries
      .filter((entry) => shownEntry(item, entry))
      .map((entry) => {
        const label = entry.name.split("/").pop();
        if (entry.kind === "table")
          return (
            <Entry
              key={entry.name}
              depth={depth}
              label={label}
              title={entry.name}
              open={(newTab) => openResource({ kind: "table", source: item.name, table: entry.name }, newTab)}
            />
          );
        const key = folderKey(item.name, entry.name);
        const state = folders[key];
        const open = openFolders.includes(key);
        return (
          <div className="metanno-viewer__group" key={entry.name}>
            <Row
              depth={depth}
              expanded={open}
              label={label}
              title={entry.name}
              onClick={() => toggleFolder(item.name, entry.name)}
            />
            {open && state !== undefined && !Array.isArray(state) && state.error && (
              <SidebarError
                text={state.error}
                onRetry={() => listFolder(item.name, entry.name)}
                onDismiss={() => {
                  setOpenFolders((current) => current.filter((other) => other !== key));
                  setFolders(({ [key]: _, ...rest }) => rest);
                }}
              />
            )}
            {open && state !== undefined && !Array.isArray(state) && !state.error && (
              <Note depth={depth + 1}>Listing…</Note>
            )}
            {open && Array.isArray(state) && state.length === 0 && <Note depth={depth + 1}>No datasets</Note>}
            {open && Array.isArray(state) && sourceEntries(item, state, depth + 1)}
          </div>
        );
      });
  // The connection of a source at the end of its row, a menu to change it when the source has several
  const connectionLabel = (item: SourceSummary) =>
    item.connections.length > 1 ? (
      <button
        className="metanno-viewer__connection"
        title="Connection used to read this database, click to change it"
        onClick={(event) => chooseConnection(event, item)}
      >
        {item.connection}
      </button>
    ) : (
      <span className="metanno-viewer__connection">{item.connection}</span>
    );
  // A database with its connection, and its tables once opened
  const sourceGroup = (item: SourceSummary, depth: number) => (
    <div className="metanno-viewer__group" key={item.name}>
      <Row
        depth={depth}
        expanded={source === item.name}
        label={item.name}
        onClick={() => setSource(source === item.name ? null : item.name)}
      >
        {connectionLabel(item)}
      </Row>
      {source === item.name && tables === null && <Note depth={depth + 1}>Loading tables…</Note>}
      {source === item.name && tablesError && (
        <SidebarError
          text={tablesError}
          onRetry={() => setTablesRevision((value) => value + 1)}
          onDismiss={() => setSource(null)}
        />
      )}
      {source === item.name && !tablesError && tables?.length === 0 && <Note depth={depth + 1}>No tables</Note>}
      {source === item.name && sourceEntries(item, tables ?? [], depth + 1)}
    </div>
  );
  // A `databases` source row, with its databases or the error of their listing under it once clicked
  const databasesGroup = (item: SourceSummary) => {
    const state = listed[item.name];
    const open = openDatabases.includes(item.name);
    return (
      <div className="metanno-viewer__group" key={item.name}>
        <Row
          depth={0}
          expanded={open}
          label={item.name}
          title={`Databases of the ${item.connection} connection`}
          onClick={() => toggleDatabases(item.name)}
        >
          {Array.isArray(state) && <span className="metanno-viewer__count">{state.length} databases</span>}
          {connectionLabel(item)}
        </Row>
        {open && state !== undefined && !Array.isArray(state) && state.error && (
          <SidebarError
            text={state.error}
            onRetry={() => listDatabases(item.name)}
            onDismiss={() => {
              setOpenDatabases((current) => current.filter((other) => other !== item.name));
              setListed(({ [item.name]: _, ...rest }) => rest);
            }}
          />
        )}
        {open && state !== undefined && !Array.isArray(state) && !state.error && (
          <Note depth={1}>Listing databases…</Note>
        )}
        {open && Array.isArray(state) && state.length === 0 && <Note depth={1}>No databases with tables</Note>}
        {open &&
          Array.isArray(state) &&
          state.filter((entry) => matches(entry.name) || entry.name === source).map((entry) => sourceGroup(entry, 1))}
      </div>
    );
  };
  // Annotation files of a folder, eg a campaign with one file per annotator, show under the folder name
  const storeGroups = [...new Set(visibleStores.map((store) => store.group).filter(Boolean))].map((group: string) => {
    const open = !closedGroups.includes(group);
    return (
      <div className="metanno-viewer__group" key={group}>
        <Row
          depth={0}
          expanded={open}
          label={group}
          onClick={() =>
            setClosedGroups(open ? [...closedGroups, group] : closedGroups.filter((name) => name !== group))
          }
        />
        {open && visibleStores.filter((store) => store.group === group).map((store) => storeEntry(store, 1))}
      </div>
    );
  });

  return (
    <>
      <aside className="metanno-viewer__sidebar">
        <div className="metanno-viewer__sidebar-top">
          <input
            className="metanno-viewer__search"
            aria-label="Search sources and tables"
            placeholder="Search sources and tables"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button
            className="metanno-viewer__toolbar-button metanno-viewer__icon-button"
            aria-label="Open configuration"
            title="Open metanno-home, with metanno.yaml, views and annotations"
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
                // The file browser shows metanno-home next to the configuration, with the views and annotations folders
                await app.commands.execute("filebrowser:open-path", { path: home });
                await app.commands.execute("docmanager:open", { path, factory: "Editor" });
              } catch (error) {
                setError(String(error));
              } finally {
                setConfigurationBusy(false);
              }
            }}
          >
            <settingsIcon.react tag="span" height="16px" width="16px" />
          </button>
          <button
            className="metanno-viewer__toolbar-button metanno-viewer__icon-button"
            aria-label="Reload configuration"
            title="Reload configuration"
            type="button"
            disabled={configurationBusy}
            onClick={async () => {
              setConfigurationBusy(true);
              try {
                await explorer.request("reload_configuration", {});
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
              width="16"
              height="16"
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
        <div className="metanno-viewer__sidebar-content">
          {error && (
            <SidebarError
              text={error}
              onRetry={() => {
                setError(null);
                setConfigurationRevision((value) => value + 1);
              }}
              onDismiss={() => setError(null)}
            />
          )}
          <section className="metanno-viewer__section" aria-label="Recipes">
            <div className="metanno-viewer__section-title">Recipes</div>
            {recipesError && <Note depth={0}>{errorText(recipesError)}</Note>}
            {recipes
              .filter((recipe) => matches(recipe.name))
              .map((recipe) => (
                <Entry
                  key={recipe.name}
                  depth={0}
                  label={recipe.name}
                  title={recipe.tables ? `Reads ${Object.keys(recipe.tables).join(", ")}` : undefined}
                  open={(newTab) => openResource({ kind: "recipe", name: recipe.name }, newTab)}
                />
              ))}
            {recipes.length === 0 && !recipesError && (
              <Note depth={0}>No recipes, add Python files to the recipes folder of metanno-home</Note>
            )}
          </section>
          <section className="metanno-viewer__section" aria-label="Explore">
            <div className="metanno-viewer__section-title">Explore</div>
            {notebookEntries(true)}
            {views
              .filter((view) => matches(view.name))
              .map((view) => (
                <Entry
                  key={view.name}
                  depth={0}
                  label={view.name}
                  title={Object.values(view.tables)
                    .map((table) => tableLabel(table.source, table.table))
                    .join(", ")}
                  open={(newTab) => openResource({ kind: "view", name: view.name }, newTab)}
                />
              ))}
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
              .map((item) => (item.kind === "databases" ? databasesGroup(item) : sourceGroup(item, 0)))}
            {views.length === 0 && sources.length === 0 && (
              <Note depth={0}>No sources, add some with the settings button</Note>
            )}
          </section>
          <section className="metanno-viewer__section" aria-label="Annotations">
            <div className="metanno-viewer__section-title">Annotations</div>
            {visibleStores.filter((store) => !store.group).map((store) => storeEntry(store, 0))}
            {storeGroups}
            {notebookEntries(false)}
            {stores.length === 0 && !displayEntries.some((entry) => !entry.read_only) && (
              <Note depth={0}>No annotations</Note>
            )}
          </section>
        </div>
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
  private shown = 0;
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
    this.shown += 1;
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
        shown={this.shown}
      />
    ) : null;
  }
}
