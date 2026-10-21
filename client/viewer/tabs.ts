import { JupyterFrontEnd } from "@jupyterlab/application";
import type { WidgetTracker } from "@jupyterlab/apputils";
import type { ReadonlyJSONObject } from "@lumino/coreutils";
import { Widget } from "@lumino/widgets";
import { toArray } from "@lumino/algorithm";
import type { FullscreenViews } from "./fullscreen";

interface ViewerEntry {
  key: string;
  widget: Widget;
  explore: boolean;
}

// Choose visible exploration tabs while JupyterLab owns docking and session lifetime
export class ViewerTabs {
  private entries: ViewerEntry[] = [];
  private focusSequence = 0;
  private focused = new WeakMap<Widget, number>();

  readonly restoration = new WeakMap<Widget, () => ReadonlyJSONObject>();
  readonly saved = new WeakMap<Widget, Promise<void>>();

  constructor(
    private app: JupyterFrontEnd,
    readonly tracker: WidgetTracker<Widget>,
    readonly fullscreen: FullscreenViews
  ) {
    // Remember dock focus before notebook output buttons take focus back to their notebook
    app.shell.node.addEventListener("focusin", (event) => {
      const widget = toArray<Widget>(app.shell.widgets("main")).find((widget) =>
        widget.node.contains(event.target as Node)
      );
      if (widget) this.focused.set(widget, ++this.focusSequence);
    });
  }

  focus(key: string): Widget | undefined {
    const entry = this.entries.find((entry) => entry.key === key && !entry.explore);
    // A tab removed from the dock without being disposed cannot be shown again, callers open a new one
    if (entry && !entry.widget.isAttached) {
      entry.widget.dispose();
      return undefined;
    }
    if (entry) this.app.shell.activateById(entry.widget.id);
    return entry?.widget;
  }

  // A tab showing another view of the same data is found under the key of that view
  rekey(widget: Widget, key: string): void {
    const entry = this.entries.find((candidate) => candidate.widget === widget);
    if (entry) entry.key = key;
  }

  // Annotations have one tab per entry, explorations replace the most recently focused visible viewer
  open(
    key: string,
    create: () => Widget,
    options: {
      explore?: boolean;
      newTab?: boolean;
      notebook?: Widget;
      widgetId?: string;
      restore?: (widget: Widget) => ReadonlyJSONObject;
      replace?: Widget;
    } = {}
  ): Widget {
    if (!options.explore && !options.replace) {
      const existing = this.focus(key);
      if (existing) return existing;
    }
    const destination =
      options.replace ??
      (options.explore && !options.newTab
        ? toArray<Widget>(this.app.shell.widgets("main"))
            .filter(
              (widget) =>
                widget !== options.notebook &&
                widget.isVisible &&
                (this.entries.some((entry) => entry.widget === widget && entry.explore) ||
                  widget.node.matches(".jp-Launcher") ||
                  widget.node.querySelector(".jp-Launcher"))
            )
            .sort((a, b) => (this.focused.get(b) || 0) - (this.focused.get(a) || 0))[0]
        : undefined);
    if (!options.replace && this.entries.some((entry) => entry.widget === destination && entry.key === key)) {
      this.app.shell.activateById(destination.id);
      return destination;
    }
    const entry: ViewerEntry = {
      key,
      widget: create(),
      explore: Boolean(options.explore),
    };
    if (options.widgetId) entry.widget.id = options.widgetId;
    if (options.restore) {
      this.restoration.set(entry.widget, () => options.restore(entry.widget));
      this.saved.set(entry.widget, this.tracker.add(entry.widget));
    }
    this.entries.push(entry);
    entry.widget.disposed.connect(() => {
      this.entries = this.entries.filter((candidate) => candidate !== entry);
    });
    // Insert next to the replaced tab before disposing it to preserve its dock position
    const reference = destination || options.notebook;
    this.app.shell.add(
      entry.widget,
      "main",
      reference
        ? { ref: reference.id, mode: destination ? "tab-after" : "split-right", activate: !options.replace }
        : undefined
    );
    destination?.dispose();
    // A replaced panel keeps the focus where it is, e.g. in the notebook that reran its cell
    if (!options.replace) this.app.shell.activateById(entry.widget.id);
    return entry.widget;
  }
}
