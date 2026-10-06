import assert from "node:assert/strict";
import { iter } from "@lumino/algorithm";
import { ViewerTabs } from "../../client/viewer/tabs";
const { test } = require(process.env.PRET_TESTING_HELPER);

// Model dock visibility and focus with the production destination coordinator
function dock() {
  const widgets = [];
  let focus, placement;
  const shell = {
    node: {
      addEventListener: (_, listener) => {
        focus = listener;
      },
    },
    widgets: () => iter(widgets),
    activateById(id) {
      focus({ target: widgets.find((widget) => widget.id === id).node });
    },
    add(widget, area, options) {
      widgets.push(widget);
      placement = options;
    },
  };
  function widget(id, launcher = false) {
    const callbacks = [];
    const item = {
      id,
      isVisible: true,
      isAttached: true,
      node: {
        matches: () => launcher,
        querySelector: () => null,
        contains(target) {
          return target === this;
        },
      },
      disposed: { connect: (callback) => callbacks.push(callback) },
      dispose() {
        widgets.splice(widgets.indexOf(item), 1);
        callbacks.forEach((callback) => callback());
      },
    };
    return item;
  }
  const tabs = new ViewerTabs({ shell }, { add: async () => {} }, {});
  return { widgets, shell, widget, tabs, placement: () => placement };
}

test("notebook opening uses the last focused visible explorer or empty dock", () => {
  const { widgets, shell, widget, tabs, placement } = dock();
  const notebook = widget("notebook");
  shell.add(notebook);
  const first = tabs.open("first", () => widget("first"), { explore: true, notebook });
  assert.equal(placement().ref, notebook.id);
  assert.equal(placement().mode, "split-right");

  const empty = widget("empty", true);
  shell.add(empty);
  shell.activateById(empty.id);
  shell.activateById(notebook.id);
  const second = tabs.open("second", () => widget("second"), { explore: true, notebook });
  assert.equal(placement().ref, empty.id);
  assert.equal(placement().mode, "tab-after");
  assert.ok(widgets.includes(first));
  assert.ok(!widgets.includes(empty));

  shell.activateById(first.id);
  shell.activateById(notebook.id);
  const replacement = tabs.open("replacement", () => widget("replacement"), { explore: true, notebook });
  assert.equal(placement().ref, first.id);
  assert.ok(!widgets.includes(first));
  assert.ok(widgets.includes(second));
  assert.equal(
    tabs.open("replacement", () => assert.fail("Existing view must be reused"), { explore: true, notebook }),
    replacement
  );

  // A hidden destination cannot receive a new result, even when it was focused last
  shell.add(empty);
  shell.activateById(empty.id);
  empty.isVisible = false;
  replacement.isVisible = false;
  second.isVisible = false;
  shell.activateById(notebook.id);
  tabs.open("fresh", () => widget("fresh"), { explore: true, notebook });
  assert.equal(placement().ref, notebook.id);
  assert.equal(placement().mode, "split-right");
  assert.ok(widgets.includes(empty));

  const annotation = tabs.open("annotation", () => widget("annotation"), { notebook });
  assert.equal(
    tabs.open("annotation", () => assert.fail("Annotation must be reused"), { notebook }),
    annotation
  );
});
