import { JupyterFrontEnd, IRouter } from "@jupyterlab/application";
import { showErrorMessage } from "@jupyterlab/apputils";
import { LabIcon } from "@jupyterlab/ui-components";
import { Widget } from "@lumino/widgets";
import type { SourceSelection } from "./kernel_client";

const PARAM = "metanno-fullscreen";

// A fullscreen URL reopens one of these views after a page reload
export type FullscreenResource =
  | { kind: "annotation"; path: string }
  | { kind: "preview"; args: any }
  | SourceSelection;

// Encode a view in the fullscreen URL parameter, decodeFullscreenKey reads it back
export function fullscreenKey(resource: FullscreenResource): string {
  if (resource.kind === "annotation") return `annotation:${resource.path}`;
  if (resource.kind === "preview") return `preview:${JSON.stringify(resource.args)}`;
  if (resource.kind === "view") return `view:${resource.name}`;
  return `table:${encodeURIComponent(resource.source)}/${encodeURIComponent(resource.table)}`;
}

export function decodeFullscreenKey(key: string): FullscreenResource {
  // Links shared before the kind prefix hold the preview restoration data only
  if (key.startsWith("{")) return { kind: "preview", args: JSON.parse(key) };
  const kind = key.slice(0, key.indexOf(":"));
  const value = key.slice(kind.length + 1);
  if (kind === "annotation") return { kind, path: value };
  if (kind === "preview") return { kind, args: JSON.parse(value) };
  if (kind === "view") return { kind, name: value };
  if (kind === "table" && value.includes("/")) {
    const [source, ...table] = value.split("/");
    return { kind, source: decodeURIComponent(source), table: decodeURIComponent(table.join("/")) };
  }
  throw new Error("Unknown fullscreen resource");
}
const expandIcon = new LabIcon({
  name: "metanno:fullscreen",
  svgstr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<path class="jp-icon3" fill="#616161" ' +
    'd="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z"/></svg>',
});
const collapseIcon = new LabIcon({
  name: "metanno:exit-fullscreen",
  svgstr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<path class="jp-icon3" fill="#616161" ' +
    'd="M8 4h2v6H4V8h4zm6 0h2v4h4v2h-6zM4 14h6v6H8v-4H4zm10 0h6v2h-4v4h-2z"/></svg>',
});

// Show the enter or exit action on the fullscreen button of a panel toolbar
function setButton(button: HTMLButtonElement, icon: LabIcon, title: string): void {
  button.replaceChildren();
  icon.element({ container: button, width: "16px", height: "16px" });
  button.title = title;
  button.setAttribute("aria-label", title);
}

// Keep Explorer and annotation views mounted while sharing their fullscreen navigation
export class FullscreenViews {
  private entries = new Map<Widget, { key: () => string; button: HTMLButtonElement }>();
  private active: Widget | null = null;
  private host: HTMLDivElement | null = null;
  private key: string | null;

  constructor(
    app: JupyterFrontEnd,
    router: IRouter,
    private open: (key: string, existing?: Widget) => Promise<Widget>
  ) {
    const arrival = new URL(performance.getEntriesByType("navigation")[0]?.name || window.location.href);
    this.key = arrival.searchParams.get(PARAM);

    // Jupyter tree path updates skip routing and discard the query and hash before routed can fire
    const navigate = router.navigate.bind(router);
    router.navigate = (path, options = {}) => {
      if (!this.key || !options.skipRouting) return navigate(path, options);
      const current = new URL(window.location.href);
      const target = new URL(path, window.location.href);
      for (const [name, value] of current.searchParams) {
        if (!target.searchParams.has(name)) target.searchParams.set(name, value);
      }
      target.searchParams.set(PARAM, this.key);
      target.hash = target.hash || current.hash;
      const state = window.history.state;
      navigate(target.pathname + target.search + target.hash, options);
      window.history.replaceState(state, "", window.location.href);
    };
    window.addEventListener("popstate", () => {
      const key = new URL(window.location.href).searchParams.get(PARAM);
      if (key === this.key) return;
      this.key = key;
      if (key) void this.restore(key, true);
      else this.exit(undefined, false);
    });
    if (this.key) {
      const key = this.key;
      // Restore the incoming hash if Jupyter already changed the URL before this plugin activated
      const url = new URL(window.location.href);
      url.searchParams.set(PARAM, key);
      url.hash = arrival.hash;
      window.history.replaceState(window.history.state, "", url);
      void app.restored.then(() => this.restore(key, false));
    }
  }

  // Attach the shared control to a panel toolbar and keep its current resource reference
  register(widget: Widget, key: () => string): HTMLButtonElement {
    const button = document.createElement("button");
    button.className = "metanno-viewer__toolbar-button";
    setButton(button, expandIcon, "Enter fullscreen");
    button.onclick = () => {
      if (widget === this.active) this.exit(widget);
      else this.enter(widget, true, true);
    };
    this.entries.set(widget, { key, button });
    widget.disposed.connect(() => this.entries.delete(widget));
    return button;
  }

  // Resolve catalog references using the same open actions as the sidebar
  private async restore(key: string, controls: boolean): Promise<void> {
    try {
      const existing = [...this.entries].find(([, entry]) => entry.key() === key)?.[0];
      const widget = await this.open(key, existing);
      if (key !== this.key) return;
      this.enter(widget, controls, false);
    } catch (error) {
      await showErrorMessage("Cannot open fullscreen view", error);
    }
  }

  // Reparent the live content without replacing its React tree or PRET connection
  private enter(widget: Widget, controls: boolean, push: boolean): void {
    if (this.active === widget) return;
    this.exit(undefined, false);
    const content = widget.node.firstElementChild as HTMLElement;
    content.querySelector<HTMLElement>(".metanno-viewer__status")!.hidden = !controls;
    this.host = document.createElement("div");
    this.host.className = "metanno-viewer__fullscreen";
    this.host.append(content);
    document.body.append(this.host);
    document.body.classList.add("metanno-viewer-fullscreen");
    this.active = widget;
    setButton(this.entries.get(widget)!.button, collapseIcon, "Exit fullscreen");
    this.updateUrl(widget, push);
    window.dispatchEvent(new Event("resize"));
  }

  // Preserve application query parameters and hashes when fullscreen or its session changes
  updateUrl(widget: Widget, push = false): void {
    if (widget !== this.active) return;
    this.key = this.entries.get(widget)!.key();
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, this.key);
    if (push) window.history.pushState(window.history.state, "", url);
    else window.history.replaceState(window.history.state, "", url);
  }

  // Return content before Lumino detaches a panel or the user resumes normal navigation
  exit(widget?: Widget, updateUrl = true): void {
    if (!this.active || (widget && this.active !== widget)) return;
    const content = this.host!.firstElementChild as HTMLElement;
    content.querySelector<HTMLElement>(".metanno-viewer__status")!.hidden = false;
    this.active.node.append(content);
    setButton(this.entries.get(this.active)!.button, expandIcon, "Enter fullscreen");
    this.host!.remove();
    this.host = null;
    this.active = null;
    document.body.classList.remove("metanno-viewer-fullscreen");
    if (updateUrl) {
      this.key = null;
      const url = new URL(window.location.href);
      url.searchParams.delete(PARAM);
      window.history.pushState(window.history.state, "", url);
    }
    window.dispatchEvent(new Event("resize"));
  }
}
