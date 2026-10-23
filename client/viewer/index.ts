import { JupyterFrontEnd, JupyterFrontEndPlugin, ILayoutRestorer, IRouter } from "@jupyterlab/application";
import { ICommandPalette, WidgetTracker } from "@jupyterlab/apputils";
import { INotebookTracker } from "@jupyterlab/notebook";
import { DataSidebar } from "./sidebar";
import { ViewerTabs } from "./tabs";
import { openAnnotation, RecipeViewWidget, registerRecipeViews } from "./recipe_view";
import { PageConfig } from "@jupyterlab/coreutils";
import { decodeFullscreenKey, FullscreenViews } from "./fullscreen";
import { NotebookOutputs } from "./notebook_output";
import { ILauncher } from "@jupyterlab/launcher";
import { IMainMenu } from "@jupyterlab/mainmenu";
import { IPretService } from "pret";
import { Widget } from "@lumino/widgets";
import { SourceViewWidget } from "./source_view";
import { ExplorerKernelConnection, PathSelection, SourceSelection } from "./kernel_client";

const OPEN_COMMAND = "metanno-viewer:open-resource";
function isDataResource(value: unknown): value is SourceSelection | PathSelection {
  if (!value || typeof value !== "object") {
    return false;
  }
  const resource = value as Partial<SourceSelection | PathSelection>;
  if (resource.kind === "path") return typeof resource.uri === "string";
  return resource.kind === "table"
    ? typeof resource.source === "string" && typeof resource.table === "string"
    : resource.kind === "view" && typeof resource.name === "string";
}

const plugin: JupyterFrontEndPlugin<void> = {
  id: "metanno-viewer:plugin",
  autoStart: true,
  requires: [ICommandPalette, IPretService, INotebookTracker, ILayoutRestorer, IRouter],
  optional: [ILauncher, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    pretService: IPretService,
    notebooks: INotebookTracker,
    restorer: ILayoutRestorer,
    router: IRouter,
    launcher: ILauncher | null,
    mainMenu: IMainMenu | null
  ) => {
    const tracker = new WidgetTracker<Widget>({ namespace: "metanno-viewer" });
    const fullscreen = new FullscreenViews(app, router, async (key, existing) => {
      if (existing) {
        if (existing instanceof RecipeViewWidget) await existing.resumeAnnotation();
        return existing;
      }
      let resource = decodeFullscreenKey(key);
      if (resource.kind === "preview") {
        const args = resource.args;
        if (!args.output.path || args.output.read_only)
          return app.commands.execute("metanno-viewer:restore-store", { ...args, startKernel: true });
        resource = {
          kind: "annotation",
          path: args.output.path,
          metadata: {
            title: args.output.title,
            view: args.view,
            config_path: args.output.config_path,
            kernelspec: args.origin?.kernelspec,
          },
        };
      }
      if (resource.kind === "annotation") {
        let path = resource.path;
        if (!path.startsWith("/") && !path.startsWith("~"))
          path = PageConfig.getOption("serverRoot").replace(/\/$/, "") + "/" + path;
        const panel = await openAnnotation(app, pretService, tabs, path, resource.metadata, true);
        if (!panel) throw new Error("Select a kernel to open this annotation");
        return panel;
      }
      const panel = await app.commands.execute(OPEN_COMMAND, { resource, newTab: true }) as SourceViewWidget;
      await panel.renderPromise;
      return panel;
    });
    const tabs = new ViewerTabs(app, tracker, fullscreen);
    app.commands.addCommand("metanno-viewer:restore", {
      execute: async (args) => {
        const widget = (await app.commands.execute(String(args.command), {
          ...(args.args as object),
          widgetId: args.widgetId,
          newTab: true,
        })) as Widget;
        await tabs.saved.get(widget);
        return widget;
      },
    });
    void restorer.restore(tracker, {
      command: "metanno-viewer:restore",
      name: (widget) => widget.id,
      args: (widget) => ({
        ...tabs.restoration.get(widget)(),
        widgetId: widget.id,
      }),
      when: notebooks.restored,
    });
    const explorer = new ExplorerKernelConnection(app.serviceManager);
    const outputs = new NotebookOutputs(app, pretService, notebooks, tabs);
    const sidebar = new DataSidebar(app, pretService, tabs, explorer, outputs);
    app.shell.add(sidebar, "left", { rank: 600 });
    registerRecipeViews(app, pretService, notebooks, tabs);
    app.commands.addCommand(OPEN_COMMAND, {
      label: (args) => (args.resource ? "Open Metanno resource" : "Open Metanno"),
      execute: async (args) => {
        const resource = args.resource;
        if (resource !== undefined && !isDataResource(resource)) {
          throw new Error("Invalid Metanno data resource");
        }
        if (!resource) {
          app.shell.activateById(sidebar.id);
          return sidebar;
        }
        let data = resource as unknown as SourceSelection | PathSelection;
        // A dataset path opens the tab of its table in the source containing it, the tab keeps the path so a reload
        // finds the table again
        if (data.kind === "path") {
          const manager = await explorer.connect();
          const reply = await manager.request<{ source: string; table: string; connection: string }>(
            "resolve_path",
            { uri: data.uri, ...(data.connection ? { connection: data.connection } : {}) },
            60000
          );
          data = { kind: "table", ...reply.data, ...(data.title ? { title: data.title } : {}) };
        }
        const selection = data;
        const key = JSON.stringify(
          selection.kind === "table"
            ? [selection.kind, selection.source, selection.table]
            : [selection.kind, selection.name]
        );
        return tabs.open(key, () => new SourceViewWidget(explorer, pretService, selection, fullscreen), {
          explore: true,
          newTab: Boolean(args.newTab),
          widgetId: args.widgetId as string,
          restore: () => ({ command: OPEN_COMMAND, args: { resource } }),
        });
      },
    });
    palette.addItem({ command: OPEN_COMMAND, category: "Metanno" });
    launcher?.add({ command: OPEN_COMMAND, category: "Metanno", rank: 1 });
    mainMenu?.viewMenu.addGroup([{ command: OPEN_COMMAND }], 50);
  },
};

export default plugin;
