import assert from "node:assert/strict";
import { openExplorer, openNotebookPreview } from "./explorer";
const { test, getMainWidget } = require(process.env.PRET_TESTING_HELPER);

test.use({ viewport: { width: 1600, height: 1000 } });

// Compare dock groups and tab order while ignoring notebook widget IDs created on each reload
async function dockLayout(page) {
  return page.evaluate(() => {
    function describe(area) {
      if (area.type === "tab-area") return { type: area.type, tabs: area.widgets.map((widget) => widget.title.label) };
      return { type: area.type, orientation: area.orientation, children: area.children.map(describe) };
    }
    return describe(window.jupyterapp.shell.saveLayout().mainArea.dock.main);
  });
}

test("saved sessions", async ({ page, browserName }) => {
  test.setTimeout(180000);
  const { base } = await openExplorer(page);
  const sessions = await openNotebookPreview(page);
  // The viewer exposes application actions without the deferred chat command API
  assert.deepEqual(
    await page.evaluate(() =>
      ["describe-resource", "tool", "describe-active", "focus-active", "apply-filters"].filter((name) =>
        window.jupyterapp.commands.hasCommand(`metanno-viewer:${name}`)
      )
    ),
    []
  );
  const panel = page.locator(".metanno-viewer__application");
  const previewId = await panel.getAttribute("id");
  const sourceMaps = [];
  // Chromium exposes parsed script source maps through CDP
  if (browserName === "chromium") {
    const debuggerClient = await page.context().newCDPSession(page);
    debuggerClient.on("Debugger.scriptParsed", (script) => {
      if (script.sourceMapURL) sourceMaps.push(script.sourceMapURL);
    });
    await debuggerClient.send("Debugger.enable");
  }
  await panel.getByRole("button", { name: "Open notebook", exact: true }).click();
  await page.locator(".jp-Notebook .jp-CodeCell").nth(1).click();
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("notebook:run-cell");
    await window.jupyterapp.commands.execute("docmanager:save");
  });
  const saved = page.getByRole("button", { name: "Open with Metanno", exact: true }).nth(1);
  await saved.waitFor({ timeout: 60000 });
  await saved.click();
  const annotation = page.getByRole("tabpanel", { name: "Annotation", exact: true });
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 60000 });
  const annotationId = await annotation.getAttribute("id");
  await annotation.getByRole("button", { name: "Change kernel", exact: true }).click();
  const dialog = page.locator(".jp-Dialog");
  await dialog.locator("select").selectOption(JSON.stringify({ id: sessions[0].kernel.id }));
  await dialog.getByRole("button", { name: /^Select(?: Kernel)?$/ }).click();
  await page.waitForFunction((id) => {
    const panel = document.getElementById(id);
    return !panel.querySelector(".metanno-viewer__pret-host").inert && !panel.textContent.includes("Opening view");
  }, annotationId);
  await annotation.getByText("Updated todo", { exact: true }).waitFor();
  assert.ok(!(await annotation.innerText()).includes("Comms are disabled"));
  assert.equal((await (await fetch(base + "/api/sessions")).json()).length, sessions.length);
  await annotation.getByRole("button", { name: "Reload view", exact: true }).click();
  await page.waitForFunction(
    (id) => !document.getElementById(id).querySelector(".metanno-viewer__pret-host").inert,
    annotationId
  );
  console.log("Existing notebook kernel selection and Reload view passed");
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("metanno-viewer:open-resource", {
      resource: {
        kind: "table",
        title: "Source todos",
        source: "fixture",
        table: "todos",
      },
      newTab: true,
    });
  });
  const source = page.locator(".metanno-viewer-widget");
  const sourceId = await source.getAttribute("id");
  await source.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
  const layoutSaved = page.waitForResponse(
    (response) => response.request().method() === "PUT" && response.url().includes("/api/workspaces/")
  );
  const annotationWidget = await getMainWidget(page, annotationId);
  await page.evaluate(
    ({ widget, sourceId }) => {
      const app = window.jupyterapp;
      app.shell.add(widget, "main", { ref: sourceId, mode: "split-bottom" });
      app.shell.activateById(widget.id);
    },
    { widget: annotationWidget, sourceId }
  );
  await annotationWidget.dispose();
  await layoutSaved;
  const before = await dockLayout(page);
  await page.reload();
  await page.waitForFunction(() => !!window.jupyterapp);
  await page.evaluate(() => window.jupyterapp.restored);
  await page.locator(`[id="${annotationId}"]`).waitFor({ timeout: 60000 });
  await page.locator(`[id="${sourceId}"]`).waitFor({ timeout: 60000 });
  await page
    .getByRole("tabpanel", { name: "Annotation", exact: true })
    .getByText("Updated todo", { exact: true })
    .waitFor({ timeout: 60000 });
  await page.evaluate((id) => window.jupyterapp.shell.activateById(id), previewId);
  await page
    .getByRole("tabpanel", { name: "Notebook preview", exact: true })
    .getByText("Updated todo", { exact: true })
    .waitFor({ timeout: 60000 });
  await page.evaluate((id) => window.jupyterapp.shell.activateById(id), sourceId);
  await page
    .locator(`[id="${sourceId}"]`)
    .getByRole("gridcell", { name: "todos source row", exact: true })
    .waitFor({ timeout: 60000 });
  assert.deepEqual(await dockLayout(page), before);
  assert.equal(await page.locator(".metanno-viewer__application").count(), 2);
  assert.ok(!page.url().includes("__main__.map"));
  console.log("Annotation, notebook preview and source tabs restored across refresh");
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
  if (await dismiss.count()) await dismiss.click();

  // Saved origin links report a missing cell without blocking the Annotation editor
  const notebookWidget = await getMainWidget(page, await page.locator(".jp-NotebookPanel").getAttribute("id"));
  await page.evaluate((widget) => widget.content.model.sharedModel.deleteCell(1), notebookWidget);
  await notebookWidget.dispose();
  await page
    .getByRole("tabpanel", { name: "Annotation", exact: true })
    .getByRole("button", { name: "Open notebook", exact: true })
    .click();
  await page.locator(".jp-Dialog").getByText("Originating cell not found", { exact: true }).waitFor();
  await page
    .locator(".jp-Dialog")
    .getByRole("button", { name: /^(Dismiss|Close)$/ })
    .click();
  // Independently started Annotation kernels remain attached across reload and keep their tab after shutdown
  const kernelSaved = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/api/workspaces/") &&
      response.request().postData().includes(".metanno-viewer/annotations/")
  );
  const beforeNewKernel = (await (await fetch(base + "/api/sessions")).json()).length;
  await annotation.getByRole("button", { name: "Change kernel", exact: true }).click();
  await dialog.locator("select").selectOption(JSON.stringify({ name: "python3" }));
  await dialog.getByRole("button", { name: /^Select(?: Kernel)?$/ }).click();
  await page.waitForFunction(
    (id) => !document.getElementById(id).querySelector(".metanno-viewer__pret-host").inert,
    annotationId
  );
  await annotation.getByText("Updated todo", { exact: true }).waitFor();
  assert.equal((await (await fetch(base + "/api/sessions")).json()).length, beforeNewKernel + 1);
  await kernelSaved;
  await page.reload();
  await page.waitForFunction(() => !!window.jupyterapp);
  await page.evaluate(() => window.jupyterapp.restored);
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 60000 });
  const restoredAnnotation = await getMainWidget(page, annotationId);
  await page.evaluate((widget) => widget.context.shutdown(), restoredAnnotation);
  await restoredAnnotation.dispose();
  await page.reload();
  await page.waitForFunction(() => !!window.jupyterapp);
  await page.evaluate(() => window.jupyterapp.restored);
  assert.deepEqual(await dockLayout(page), before);
  await annotation
    .getByText("Error: Choose a running kernel to reload this saved Annotation", { exact: true })
    .waitFor();
  assert.equal(await annotation.getAttribute("id"), annotationId);
  console.log("New Annotation kernel restoration and stopped kernel recovery passed");
  if (browserName === "chromium") assert.ok(!sourceMaps.some((url) => url.includes("__main__.map")));
  console.log("Stale notebook origin warning and generated source map check passed");
});
