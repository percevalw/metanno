import { JupyterFrontEnd } from "@jupyterlab/application";
import { ISessionContext, ISessionContextDialogs, showErrorMessage } from "@jupyterlab/apputils";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { notebookIcon, refreshIcon } from "@jupyterlab/ui-components";
import { Widget } from "@lumino/widgets";
import { toArray } from "@lumino/algorithm";
import type { IPretHost, IPretService } from "pret";
import { ViewerTabs } from "./tabs";
import { createSession, KernelClient, ViewReply } from "./kernel_client";
import { fullscreenKey } from "./fullscreen";

const TARGET = "metanno.viewer_display";
interface AnnotationMetadata {
  title?: string;
  view?: string;
  config_path?: string;
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
  config_path: string;
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
  private kernelButton = document.createElement("button");
  private viewSelect = document.createElement("select");
  private reloadButton = document.createElement("button");
  private toolbar = document.createElement("div");
  private fullscreenError = document.createElement("div");
  private errorText = document.createElement("span");
  private kernelGeneration = 0;
  private content = document.createElement("div");
  private status = document.createElement("span");
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
    this.addClass("metanno-viewer__application");
    const toolbar = this.toolbar;
    toolbar.className = "metanno-viewer__status";
    toolbar.append(this.status);
    const kernel = this.kernelButton;
    kernel.textContent = context.session?.kernel?.name || origin.kernelspec;
    kernel.title = output.path ? "Change kernel" : "This preview uses its notebook kernel";
    kernel.setAttribute("aria-label", "Change kernel");
    kernel.className = "metanno-viewer__toolbar-button";
    kernel.disabled = !output.path;
    kernel.onclick = () => void this.changeKernel().catch((error) => this.showError(error));
    // Choosing a view renders it again, Annotations also save it with its recipe in the Store metadata
    const select = this.viewSelect;
    select.className = "metanno-viewer__recipe";
    select.setAttribute("aria-label", "View recipe");
    select.title = output.path && !output.read_only ? "View recipe, saved with the Annotation" : "View recipe";
    this.setChoices(output.choices);
    select.onchange = () => void this.changeView(select.value).catch((error) => this.showError(error));
    // Text labels before the kernel button and the recipe selector
    const label = (text: string, control: HTMLElement) => {
      const node = document.createElement("label");
      node.className = "metanno-viewer__toolbar-label";
      node.append(text, control);
      return node;
    };
    toolbar.append(label("Kernel:", kernel), label("Recipe:", select));
    if (output.path) {
      const recover = this.reloadButton;
      refreshIcon.element({ container: recover, width: "16px", height: "16px" });
      recover.setAttribute("aria-label", "Reload view");
      recover.title = "Reload the saved Store and rerun its view recipe in the selected kernel";
      recover.className = "metanno-viewer__toolbar-button";
      recover.onclick = () => void this.renderView(true).catch((error) => this.showError(error));
      toolbar.append(recover);
    }
    if (origin.notebook) {
      const source = document.createElement("button");
      notebookIcon.element({ container: source, width: "16px", height: "16px" });
      source.setAttribute("aria-label", "Open notebook");
      source.className = "metanno-viewer__toolbar-button";
      source.title = `Open originating notebook, ${origin.notebook}`;
      source.onclick = () =>
        void (async () => {
          this.tabs.fullscreen.exit(this);
          const panel = (await app.commands.execute("docmanager:open", {
            path: origin.notebook,
          })) as NotebookPanel;
          await panel.context.ready;
          const index = panel.content.widgets.findIndex((cell) => cell.model.id === origin.cell);
          app.shell.activateById(panel.id);
          if (index >= 0) panel.content.activeCellIndex = index;
          else if (origin.cell)
            await showErrorMessage(
              "Originating cell not found",
              `The saved Store points to ${origin.notebook}, but its originating cell is no longer present. ` +
                "The notebook may have changed or been replaced since the Store was saved."
            );
        })().catch((error) => showErrorMessage("Cannot open originating notebook", error));
      toolbar.append(source);
    }
    toolbar.append(tabs.fullscreen.register(this, () =>
      fullscreenKey(
        output.path && !output.read_only
          ? { kind: "annotation", path: output.path }
          : { kind: "preview", args: this.restoreData().args }
      )
    ));
    this.content.className = "metanno-viewer__pret-host";
    this.fullscreenError.className = "metanno-viewer__error";
    this.fullscreenError.setAttribute("role", "alert");
    this.fullscreenError.hidden = true;
    const dismiss = document.createElement("button");
    dismiss.className = "metanno-viewer__dismiss";
    dismiss.textContent = "×";
    dismiss.title = "Dismiss";
    dismiss.setAttribute("aria-label", "Dismiss error");
    dismiss.onclick = () => (this.fullscreenError.hidden = true);
    this.fullscreenError.append(this.errorText, dismiss);
    const viewNode = document.createElement("div");
    viewNode.className = "metanno-viewer__view";
    viewNode.append(toolbar, this.fullscreenError, this.content);
    this.node.append(viewNode);
    this.setContext(context, owned);
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
    this.kernelButton.textContent = kernel?.name || this.origin.kernelspec;
    this.status.textContent = available
      ? `${this.output.path || this.origin.notebook || "Transient data"}${
          this.output.read_only ? " · Read only" : ""
        }`
      : "Kernel disconnected";
    this.fullscreenError.hidden = available;
    this.errorText.textContent = "Kernel disconnected, reconnect or rerun the originating cell";
  }

  showError(error: unknown): void {
    this.status.textContent = "Could not open view";
    this.errorText.textContent = String(error);
    this.fullscreenError.hidden = false;
    this.content.inert = true;
  }

  // Serialize kernel changes and reopening while keeping navigation actions available
  private setOpening(opening: boolean): void {
    this.opening = opening;
    this.kernelButton.disabled = opening || !this.output.path;
    this.viewSelect.disabled = opening || this.viewSelect.options.length < 2;
    this.reloadButton.disabled = opening;
    if (opening) this.content.inert = true;
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
    this.fullscreenError.hidden = true;
    this.status.textContent = "Opening view…";
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

  // List the views of the recipe selector, keeping the current view first when the kernel did not list it
  private setChoices(choices: string[] = []): void {
    const views = [...new Set([this.view, ...choices])];
    this.viewSelect.replaceChildren(...views.map((view) => new Option(view, view)));
    this.viewSelect.value = this.view;
    this.viewSelect.disabled = this.opening || views.length < 2;
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
    config_path: metadata.config_path || "",
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
