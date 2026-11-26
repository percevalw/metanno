import { JupyterFrontEnd } from "@jupyterlab/application";
import { ISessionContext, ISessionContextDialogs, showErrorMessage } from "@jupyterlab/apputils";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { notebookIcon, refreshIcon } from "@jupyterlab/ui-components";
import { Widget } from "@lumino/widgets";
import { toArray } from "@lumino/algorithm";
import React from "react";
import ReactDOM from "react-dom";
import type { IPretHost, IPretService } from "pret";
import { ViewerTabs } from "./tabs";
import { createSession, KernelClient, ViewReply } from "./kernel_client";
import { fullscreenKey } from "./fullscreen";
import { metannoIcon } from "./icons";
import { TabStatus, ViewToolbar } from "./view_toolbar";

const TARGET = "metanno.viewer_display";
export interface AnnotationMetadata {
  title?: string;
  view?: string;
  origin?: NotebookOrigin;
  kernelspec?: string;
}
export type NotebookOrigin = { notebook?: string; cell?: string; kernelspec: string };
export type ViewOpenerData = {
  id: string;
  view: string | null;
  choices: string[];
  title: string;
  path: string | null;
  read_only: boolean;
  cell: string | null;
};
// Key of the tab showing `view` of `output`, Annotations have one tab per file, other data one tab per view
export function tabKey(output: ViewOpenerData, view: string): string {
  return output.path && !output.read_only ? `file:${output.path}` : `${output.id}:${view}`;
}

// Restoration data of a RecipeViewWidget tab, saved by the layout restorer through ViewerTabs
export const recipeRestoreData = (widget: Widget) => (widget as RecipeViewWidget).restoreData();

// Independently opened panels share their session until the last panel releases it
const ownedContexts = new Map<ISessionContext, number>();

// Resolve the shared dialog service across JupyterLab versions with different Lumino token types
async function selectKernel(app: JupyterFrontEnd, context: ISessionContext): Promise<void> {
  const dialogs = await app.resolveRequiredService<ISessionContextDialogs>(ISessionContextDialogs as any);
  await dialogs.selectKernel(context);
}

// Render the selected Store view in the kernel session that supplied it
export class RecipeViewWidget extends Widget {
  private host: IPretHost | null = null;
  private manager: KernelClient | null = null;
  private viewRef: string | null = null;
  private lostKernel = false;
  private opening = false;
  private kernelGeneration = 0;
  private status: TabStatus = { text: "" };
  private choices: string[];
  private fullscreenButton: HTMLButtonElement;
  // The toolbar and the PRET host node, rendered by renderToolbar into the node that FullscreenViews moves
  private frame = document.createElement("div");
  private content!: HTMLDivElement;
  private context: ISessionContext;

  constructor(
    private app: JupyterFrontEnd,
    private pret: IPretService,
    context: ISessionContext,
    private output: ViewOpenerData,
    private view: string,
    private origin: NotebookOrigin,
    private tabs: ViewerTabs,
    owned = false
  ) {
    super();
    this.node.tabIndex = -1;
    this.id = `metanno-view-${crypto.randomUUID()}`;
    this.title.label = output.title;
    this.title.closable = true;
    this.title.icon = metannoIcon;
    this.addClass("metanno-viewer__application");
    this.choices = output.choices;
    this.fullscreenButton = tabs.fullscreen.register(this, () =>
      fullscreenKey(
        output.path && !output.read_only
          ? {
              kind: "annotation",
              path: output.path,
              metadata: {
                title: output.title,
                view: this.view,
                kernelspec: this.context.session?.kernel?.name || this.origin.kernelspec,
              },
            }
          : { kind: "preview", args: this.restoreData().args }
      )
    );
    this.frame.className = "metanno-viewer__view";
    this.node.append(this.frame);
    this.setContext(context, owned);
    this.renderToolbar();
  }

  // Render the toolbar with the current state of the tab, and the PRET host node on the first call. React listens to
  // the clicks on `frame`, which FullscreenViews moves with the toolbar, so the controls keep working in fullscreen
  private renderToolbar(): void {
    const { output, origin } = this;
    // The views of the recipe selector, the current view first when the kernel did not list it
    const views = [...new Set([this.view, ...this.choices])];
    ReactDOM.render(
      <>
        <ViewToolbar status={this.status} fullscreenButton={this.fullscreenButton}>
          <label className="metanno-viewer__toolbar-label">
            Kernel:
            <button
              className="metanno-viewer__toolbar-button"
              aria-label="Change kernel"
              title={output.path ? "Change kernel" : "This preview uses its notebook kernel"}
              disabled={this.opening || !output.path}
              onClick={() => void this.changeKernel().catch((error) => this.showError(error))}
            >
              {this.context.session?.kernel?.name || origin.kernelspec}
            </button>
          </label>
          <label className="metanno-viewer__toolbar-label">
            Recipe:
            {/* Choosing a view renders it again, Annotations also save it with its recipe in the Store metadata */}
            <select
              className="metanno-viewer__recipe"
              aria-label="View recipe"
              title={output.path && !output.read_only ? "View recipe, saved with the Annotation" : "View recipe"}
              value={this.view}
              disabled={this.opening || views.length < 2}
              onChange={(event) => void this.changeView(event.target.value).catch((error) => this.showError(error))}
            >
              {views.map((view) => (
                <option key={view} value={view}>
                  {view}
                </option>
              ))}
            </select>
          </label>
          {output.path && (
            <button
              className="metanno-viewer__toolbar-button metanno-viewer__icon-button"
              aria-label="Reload view"
              title="Reload the saved Store and rerun its view recipe in the selected kernel"
              disabled={this.opening}
              onClick={() => void this.renderView(true).catch((error) => this.showError(error))}
            >
              <refreshIcon.react tag="span" width="16px" height="16px" />
            </button>
          )}
          {origin.notebook && (
            <button
              className="metanno-viewer__toolbar-button metanno-viewer__icon-button"
              aria-label="Open notebook"
              title={`Open originating notebook, ${origin.notebook}`}
              onClick={() =>
                void this.openNotebook().catch((error) => showErrorMessage("Cannot open originating notebook", error))
              }
            >
              <notebookIcon.react tag="span" width="16px" height="16px" />
            </button>
          )}
        </ViewToolbar>
        <div className="metanno-viewer__pret-host" ref={(node) => node && (this.content = node)} />
      </>,
      this.frame
    );
  }

  // Leave fullscreen and show the originating cell of the view in its notebook
  private async openNotebook(): Promise<void> {
    const { notebook, cell } = this.origin;
    this.tabs.fullscreen.exit(this);
    const panel = (await this.app.commands.execute("docmanager:open", { path: notebook })) as NotebookPanel;
    await panel.context.ready;
    const index = panel.content.widgets.findIndex((widget) => widget.model.id === cell);
    this.app.shell.activateById(panel.id);
    if (index >= 0) panel.content.activeCellIndex = index;
    else if (cell)
      await showErrorMessage(
        "Originating cell not found",
        `The saved Store points to ${notebook}, but its originating cell is no longer present. ` +
          "The notebook may have changed or been replaced since the Store was saved."
      );
  }

  // Find the existing comm connection before attaching another Annotation to its kernel
  private findContext(kernelId: string | undefined): ISessionContext | undefined {
    if (!kernelId) return undefined;
    return toArray<Widget>(this.app.shell.widgets("main"))
      .map((widget) =>
        widget instanceof RecipeViewWidget ? widget.context : widget instanceof NotebookPanel ? widget.sessionContext : null
      )
      .find((context) => context?.session?.kernel?.id === kernelId && context.session.kernel.handleComms);
  }

  // Reuse the comm owner so PRET hosts and notebook outputs share one client manager
  private setContext(context: ISessionContext, owned: boolean): void {
    const kernel = context.session?.kernel;
    const existing = kernel && !kernel.handleComms ? this.findContext(kernel.id) : undefined;
    if (existing && existing !== context) {
      if (owned) context.dispose();
      context = existing;
      owned = false;
    }
    if (context === this.context) return;
    if (owned || ownedContexts.has(context)) ownedContexts.set(context, (ownedContexts.get(context) || 0) + 1);
    this.releaseContext();
    this.context = context;
    context.connectionStatusChanged.connect(this.connectionChanged, this);
    context.kernelChanged.connect(this.kernelChanged, this);
    context.statusChanged.connect(this.kernelStatusChanged, this);
    context.disposed.connect(this.kernelChanged, this);
  }

  // Save the current connection path so refresh can reattach without executing notebook cells
  restoreData() {
    return {
      command: "metanno-viewer:restore-store",
      args: {
        output: this.output,
        view: this.view,
        origin: { ...this.origin, kernelspec: this.context.session?.kernel?.name || this.origin.kernelspec },
        sessionPath: this.context.path,
        widgetId: this.id,
      },
    };
  }

  protected onCloseRequest(): void {
    this.dispose();
  }

  protected onActivateRequest(): void {
    this.node.focus();
  }

  private kernelStatusChanged(_sender: ISessionContext, status: string): void {
    if (
      ["restarting", "autorestarting", "dead"].includes(status) ||
      (status === "starting" && this.viewRef && !this.opening)
    )
      this.kernelChanged();
  }

  private kernelChanged(): void {
    this.kernelGeneration++;
    this.lostKernel = true;
    this.connectionChanged();
  }

  private connectionChanged(): void {
    const kernel = this.context.session?.kernel;
    const available = kernel?.connectionStatus === "connected" && !this.lostKernel;
    this.content.inert = !available;
    // The path of the view, or the lost kernel with what to do on hover
    this.setStatus(
      available
        ? {
            text: `${this.output.path || this.origin.notebook || "Transient data"}${
              this.output.read_only ? " · Read only" : ""
            }`,
          }
        : { text: "Kernel disconnected", kind: "error", title: "Reconnect the kernel or rerun the originating cell" }
    );
  }

  private setStatus(status: TabStatus): void {
    this.status = status;
    this.renderToolbar();
  }

  showError(error: unknown): void {
    this.setStatus({ text: String((error as Error)?.message ?? error), kind: "error" });
    this.content.inert = true;
  }

  // Serialize kernel changes and reopening while keeping navigation actions available
  private setOpening(opening: boolean): void {
    this.opening = opening;
    if (opening) this.content.inert = true;
    this.renderToolbar();
  }

  // Reopened Annotations render the view saved in their Store unless `view` asks for another one
  async renderView(reopen = false, view?: string): Promise<void> {
    if (this.opening || this.isDisposed) return;
    this.setOpening(true);
    const generation = this.kernelGeneration;
    let manager: KernelClient | null = null;
    // Timing logs of the opening stages, read when diagnosing slow view openings
    const start = performance.now();
    const timing = (stage: string, details: object = {}) =>
      console.info("Metanno timing:", stage, {
        ms: Math.round(performance.now() - start),
        at: Math.round(performance.now()),
        ...details,
      });
    this.setStatus({ text: "Opening view…", kind: "busy" });
    this.host?.dispose();
    try {
      const kernel = this.context.session?.kernel;
      if (!kernel)
        throw new Error(
          this.output.path
            ? "Choose a running kernel to reload this saved Annotation"
            : "The notebook kernel has stopped, rerun the originating cell to recreate this preview"
        );
      if (reopen) {
        const reply = await kernel.requestExecute({
          code: "from metanno.viewer.view_opener import register_view_comm\nregister_view_comm()",
          silent: true,
          store_history: false,
        }).done;
        if (reply.content.status !== "ok") throw new Error("The selected kernel could not initialize Metanno");
        timing("kernel initialized");
      }
      if (this.isDisposed) return;
      if (this.manager && this.viewRef) {
        await this.manager.request("close", { view_ref: this.viewRef }, 1000).catch(() => undefined);
        this.viewRef = null;
      }
      if (this.isDisposed) return;
      this.manager?.dispose();
      manager = new KernelClient(kernel, TARGET);
      this.manager = manager;
      await manager.connect();
      timing("comm connected");
      this.host = this.pret.createHost(this.context, this.content);
      const reply = await manager.request<ViewReply>(reopen ? "reopen" : "open", {
        id: this.output.id,
        path: this.output.path,
        view: reopen ? view ?? null : view ?? this.view,
        read_only: this.output.read_only,
        origin: { ...this.origin, kernelspec: kernel.name },
      });
      // A replaced tab still owns the returned view until its close request completes
      if (this.isDisposed || generation !== this.kernelGeneration) {
        await manager.request("close", { view_ref: reply.data.view_ref });
        return;
      }
      timing("view received", { kernel: reply.data.timings });
      this.viewRef = reply.data.view_ref;
      this.view = reply.data.view;
      this.setChoices(reply.data.choices);
      await this.host.render(reply.data);
      timing("view rendered");
      if (!this.isDisposed && generation === this.kernelGeneration) {
        this.lostKernel = false;
        this.connectionChanged();
      }
    } finally {
      this.setOpening(false);
      if (this.isDisposed && !this.viewRef) manager?.dispose();
    }
  }

  private setChoices(choices: string[] = []): void {
    this.choices = choices;
    this.renderToolbar();
  }

  // Render another view of the same data in this tab, a preview is then found under the key of that view.
  // The selector keeps a view that failed to render, so choosing the previous view renders it again
  async changeView(view: string): Promise<void> {
    if (this.opening || this.isDisposed || view === this.view) return;
    this.view = view;
    await this.renderView(Boolean(this.output.path), view);
    this.tabs.rekey(this, tabKey(this.output, view));
    await this.tabs.tracker.save(this);
    this.tabs.fullscreen.updateUrl(this);
  }

  // Direct saved links can resume a restored tab after its previous kernel has stopped
  async resumeAnnotation(): Promise<void> {
    if (!this.output.path || this.output.read_only || this.context.session?.kernel) return;
    await this.context.changeKernel({ name: this.origin.kernelspec });
    await this.renderView(true);
  }

  async changeKernel(): Promise<void> {
    if (this.opening || this.isDisposed) return;
    if (!this.output.path)
      throw new Error("Transient data belongs to its notebook kernel, rerun the notebook to recreate it");
    this.setOpening(true);
    try {
      // A separate selection session leaves the borrowed notebook and other panels untouched
      const context = createSession(
        this.app.serviceManager,
        `.metanno-viewer/annotations/${crypto.randomUUID()}`,
        this.output.title
      );
      try {
        await context.initialize();
        let selected: ISessionContext = context;
        const changeKernel = context.changeKernel.bind(context);
        // The standard dialog can select a borrowed connection without creating a duplicate server session
        context.changeKernel = async (model) => {
          const existing = this.findContext(model.id);
          if (existing) {
            selected = existing;
            return existing.session!.kernel;
          }
          return changeKernel(model);
        };
        await selectKernel(this.app, context);
        context.changeKernel = changeKernel;
        if (!selected.session?.kernel || this.isDisposed) {
          context.dispose();
          return;
        }
        if (selected !== context) context.dispose();
        this.setContext(selected, selected === context);
        await this.tabs.tracker.save(this);
        this.tabs.fullscreen.updateUrl(this);
      } catch (error) {
        context.dispose();
        throw error;
      }
    } finally {
      this.setOpening(false);
      this.connectionChanged();
    }
    await this.renderView(true);
  }

  // Release only sessions created by Metanno, notebook sessions keep their own lifetime
  private releaseContext(): void {
    if (!this.context) return;
    this.context.connectionStatusChanged.disconnect(this.connectionChanged, this);
    this.context.kernelChanged.disconnect(this.kernelChanged, this);
    this.context.statusChanged.disconnect(this.kernelStatusChanged, this);
    this.context.disposed.disconnect(this.kernelChanged, this);
    const count = ownedContexts.get(this.context);
    if (count === 1) {
      ownedContexts.delete(this.context);
      this.context.dispose();
    } else if (count) ownedContexts.set(this.context, count - 1);
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.tabs.fullscreen.exit(this);
    this.host?.dispose();
    const manager = this.manager;
    if (manager && this.viewRef) {
      void manager
        .request("close", { view_ref: this.viewRef })
        .catch(() => undefined)
        .finally(() => manager.dispose());
    } else if (!this.opening) manager?.dispose();
    this.releaseContext();
    ReactDOM.unmountComponentAtNode(this.frame);
    super.dispose();
  }
}

// Reopen file backed data without executing the notebook that originally prepared it
export async function openAnnotation(
  app: JupyterFrontEnd,
  pret: IPretService,
  tabs: ViewerTabs,
  path: string,
  metadata: AnnotationMetadata,
  newTab = false
): Promise<RecipeViewWidget | undefined> {
  // One tab per Annotation, which shows the view saved in its Store
  const key = `file:${path}`;
  const existing = tabs.focus(key);
  if (existing) {
    await (existing as RecipeViewWidget).resumeAnnotation();
    return existing as RecipeViewWidget;
  }
  const context = createSession(
    app.serviceManager,
    `.metanno-viewer/annotations/${encodeURIComponent(path)}`,
    metadata.title || path
  );
  await context.initialize();
  await app.serviceManager.kernelspecs.ready;
  // Initializing by path attaches to a running Annotation without starting another kernel
  if (!context.session?.kernel) {
    if (metadata.kernelspec && app.serviceManager.kernelspecs.specs?.kernelspecs[metadata.kernelspec]) {
      await context.changeKernel({ name: metadata.kernelspec });
    } else await selectKernel(app, context);
  }
  if (!context.session?.kernel) {
    context.dispose();
    return;
  }
  const output: ViewOpenerData = {
    id: key,
    title: metadata.title || path.split("/").pop()!,
    path,
    read_only: false,
    view: metadata.view || "table",
    choices: [],
    cell: null,
  };
  let created = false;
  const panel = tabs.open(
    key,
    () => {
      created = true;
      return new RecipeViewWidget(
        app,
        pret,
        context,
        output,
        output.view!,
        metadata.origin || { kernelspec: context.session!.kernel!.name },
        tabs,
        true
      );
    },
    { newTab, restore: recipeRestoreData }
  );
  if (!created) {
    context.dispose();
    return panel as RecipeViewWidget;
  }
  await (panel as RecipeViewWidget).renderView(true).catch((error) => {
    (panel as RecipeViewWidget).showError(error);
    throw error;
  });
  return panel as RecipeViewWidget;
}

// Register restoration separately from notebook output controls
export function registerRecipeViews(
  app: JupyterFrontEnd,
  pret: IPretService,
  notebooks: INotebookTracker,
  tabs: ViewerTabs
): void {
  // Restore the tab before rendering so a stopped kernel cannot erase its dock position
  app.commands.addCommand("metanno-viewer:restore-store", {
    execute: async (args) => {
      const output = args.output as unknown as ViewOpenerData;
      const origin = args.origin as unknown as NotebookOrigin;
      const view = args.view as string;
      const key = tabKey(output, view);
      const existing = toArray<Widget>(app.shell.widgets("main")).find(
        (widget) => widget instanceof RecipeViewWidget && widget.id === args.widgetId
      ) || tabs.focus(key);
      if (existing) return existing;
      // Restored notebooks already own a connection, only independent Annotations need another session
      let context: ISessionContext = notebooks.find(
        (notebook) => notebook.context.path === args.sessionPath
      )?.sessionContext;
      const owned = !context;
      if (!context) context = createSession(app.serviceManager, args.sessionPath as string, output.title);
      await context.initialize();
      if (args.startKernel && output.path && !context.session?.kernel) {
        await context.changeKernel({ name: origin.kernelspec });
      }
      const panel = tabs.open(key, () => new RecipeViewWidget(app, pret, context, output, view, origin, tabs, owned), {
        explore: output.read_only,
        newTab: true,
        widgetId: args.widgetId as string,
        restore: recipeRestoreData,
      }) as RecipeViewWidget;
      void panel.renderView(Boolean(output.path)).catch((error) => panel.showError(error));
      return panel;
    },
  });
}
