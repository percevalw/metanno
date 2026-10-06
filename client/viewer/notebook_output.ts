import { JupyterFrontEnd } from "@jupyterlab/application";
import { INotebookTracker, NotebookPanel } from "@jupyterlab/notebook";
import { IRenderMime } from "@jupyterlab/rendermime";
import { Widget } from "@lumino/widgets";
import { Signal } from "@lumino/signaling";
import type { IPretService } from "pret";
import { ViewerTabs } from "./tabs";
import { RecipeViewWidget, openAnnotation, NotebookOrigin, ViewOpenerData } from "./recipe_view";

const MIME = "application/vnd.metanno-viewer+json";
export type OpenerEntry = {
  id: string;
  title: string;
  view: string;
  path: string | null;
  read_only: boolean;
  origin: NotebookOrigin;
  open(newTab?: boolean): Promise<unknown>;
};

// Track notebook controls for the sidebar and release them when their notebook closes
export class NotebookOutputs {
  readonly entries = new Map<string, OpenerEntry>();
  readonly changed = new Signal<this, void>(this);

  constructor(app: JupyterFrontEnd, pret: IPretService, notebooks: INotebookTracker, tabs: ViewerTabs) {
    const outputs = this;
    function register(notebook: NotebookPanel): void {
      notebook.disposed.connect(() => {
        for (const [key, entry] of outputs.entries) {
          if (entry.origin.notebook !== notebook.context.path) continue;
          if (entry.read_only) outputs.entries.delete(key);
          else {
            const metadata = {
              title: entry.title,
              view: entry.view,
              origin: entry.origin,
              kernelspec: entry.origin.kernelspec,
            };
            entry.open = (newTab = false) => openAnnotation(app, pret, tabs, entry.path!, metadata, newTab);
          }
        }
        outputs.changed.emit();
      });
      notebook.content.rendermime.addFactory(
        {
          safe: false,
          mimeTypes: [MIME],
          createRenderer: () => new ViewOpenerRenderer(notebook),
        },
        0
      );
    }
    class ViewOpenerRenderer extends Widget implements IRenderMime.IRenderer {
      constructor(private notebook: NotebookPanel) {
        super();
        this.addClass("metanno-viewer__status");
      }
      async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        const output = model.data[MIME] as unknown as ViewOpenerData;
        this.node.replaceChildren();
        const select = document.createElement("select");
        select.className = "metanno-viewer__recipe";
        select.setAttribute("aria-label", "View recipe");
        for (const choice of output.choices) select.add(new Option(choice, choice));
        select.value = output.view || output.choices[0];
        const button = document.createElement("button");
        button.textContent = "Open with Metanno";
        button.className = "metanno-viewer__toolbar-button";
        const status = document.createElement("span");
        const launch = () =>
          void (async () => {
            const cell = this.notebook.content.widgets.find((cell) => cell.node.contains(this.node));
            const kernel = this.notebook.sessionContext.session?.kernel;
            if (!kernel || !cell) throw new Error("Open this output from its running notebook");
            const origin = {
              notebook: this.notebook.context.path,
              cell: cell.model.id,
              kernelspec: kernel.name,
            };
            const view = select.value;
            const key = output.path && !output.read_only ? `file:${output.path}` : `${output.id}:${view}`;
            const open = async (newTab = false) => {
              if (!output.read_only && this.notebook.isDisposed) {
                const reopened = await openAnnotation(
                  app,
                  pret,
                  tabs,
                  output.path!,
                  {
                    title: output.title,
                    view,
                    config_path: output.config_path,
                    origin,
                    kernelspec: origin.kernelspec,
                  },
                  newTab
                );
                await reopened?.changeView(view);
                return;
              }
              let created = false;
              const panel = tabs.open(
                key,
                () => {
                  created = true;
                  return new RecipeViewWidget(app, pret, this.notebook.sessionContext, output, view, origin, tabs);
                },
                {
                  explore: output.read_only,
                  newTab,
                  notebook: this.notebook,
                  restore: (widget) => (widget as RecipeViewWidget).restoreData(),
                }
              );
              // An open Annotation tab switches to the view chosen in this output
              const rendered = created
                ? (panel as RecipeViewWidget).renderView()
                : (panel as RecipeViewWidget).changeView(view);
              await rendered.catch((error) => {
                (panel as RecipeViewWidget).showError(error);
                throw error;
              });
            };
            if (!outputs.entries.has(key)) {
              outputs.entries.set(key, {
                id: key,
                title: output.title,
                view,
                path: output.path,
                read_only: output.read_only,
                origin,
                open,
              });
              outputs.changed.emit();
            }
            await open();
          })().catch((error) => {
            status.textContent = String(error);
          });
        button.onclick = () => launch();
        this.node.append(select, button);
        this.node.append(status);
      }
    }
    notebooks.forEach(register);
    notebooks.widgetAdded.connect((_sender, notebook) => register(notebook));
  }
}
