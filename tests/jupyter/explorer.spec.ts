import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { openExplorer, openNotebookPreview } from "./explorer";
const { test, expect } = require(process.env.PRET_TESTING_HELPER);

test.use({ viewport: { width: 1600, height: 1000 } });

// Bring the Metanno sidebar back after its settings button showed the file browser in its place
async function showSidebar(page) {
  await page.evaluate(() => window.jupyterapp.shell.activateById("metanno-viewer-sidebar"));
}

test("notebook and source view lifecycle", async ({ page }) => {
  test.setTimeout(180000);
  const { directory, base } = await openExplorer(page, { delayed: true });
  const sessions = await openNotebookPreview(page);
  const open = page.getByRole("button", { name: "Open with Metanno", exact: true }).first();
  const panel = page.locator(".metanno-viewer__application");
  // Closing the last host leaves the borrowed notebook alive and stops comm recovery
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^Notebook preview$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^planner.ipynb$/ })
    .click();
  const requestsBeforeClose = fs
    .readFileSync(path.join(directory, "browser.log"), "utf8")
    .split("PRET: Requesting comm info").length;
  await page.evaluate(async () => {
    const kernel = window.jupyterapp.shell.currentWidget.sessionContext.session.kernel;
    await kernel.requestExecute({
      code: `for comm in list(get_ipython().kernel.comm_manager.comms.values()):
    if comm.target_name == "pret":
        comm.close()`,
      silent: true,
      store_history: false,
    }).done;
  });
  await page.waitForTimeout(3500);
  assert.equal(
    fs.readFileSync(path.join(directory, "browser.log"), "utf8").split("PRET: Requesting comm info").length,
    requestsBeforeClose
  );
  assert.equal((await (await fetch(base + "/api/sessions")).json()).length, sessions.length);
  await open.click();
  await panel.getByText("Example todo", { exact: true }).waitFor();
  await panel.getByRole("button", { name: "Open notebook", exact: true }).click();
  await page.locator(".jp-Notebook").getByRole("combobox", { name: "View recipe" }).selectOption("alternate");
  assert.equal(
    await page.locator(".jp-Notebook").getByRole("button", { name: "Open in new tab", exact: true }).count(),
    0
  );
  const preservedViewer = await panel.getAttribute("id");
  const launcherId = await page.evaluate(async (reference) => {
    const app = window.jupyterapp;
    const launcher = await app.commands.execute("launcher:create");
    app.shell.add(launcher, "main", { ref: reference, mode: "split-bottom" });
    app.shell.activateById(launcher.id);
    return launcher.id;
  }, preservedViewer);
  await page.locator(`[id="${launcherId}"] .jp-LauncherCard`).first().focus();
  // Compare the split position because tab bars can change the content rectangle height
  const dockPath = (id) =>
    page.evaluate((id) => {
      function find(area, path = []) {
        if (!area) return null;
        if (area.type === "tab-area") return area.widgets.some((widget) => widget.id === id) ? path : null;
        for (let index = 0; index < area.children.length; index++) {
          const match = find(area.children[index], [...path, [area.orientation, index]]);
          if (match) return match;
        }
        return null;
      }
      return find(window.jupyterapp.shell.saveLayout().mainArea.dock.main);
    }, id);
  const launcherPosition = await dockPath(launcherId);
  assert.ok(launcherPosition);
  await open.click();
  assert.equal(await page.locator(`[id="${launcherId}"]`).count(), 0);
  assert.equal(await page.locator(`[id="${preservedViewer}"]`).count(), 1);
  assert.equal(await page.locator(".metanno-viewer__application").count(), 2);
  const destinationId = await page.locator(".metanno-viewer__application").last().getAttribute("id");
  assert.deepEqual(await dockPath(destinationId), launcherPosition);
  await page.locator(".metanno-viewer__application").last().getByText("Example todo", { exact: true }).waitFor();
  await page
    .locator(".metanno-viewer__application")
    .last()
    .getByRole("button", { name: "Open notebook", exact: true })
    .click();
  await page.locator(".jp-Notebook .jp-CodeCell").nth(1).click();
  await page.evaluate(async () => {
    await window.jupyterapp.shell.currentWidget.sessionContext.ready;
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  const savedOutput = page.getByRole("button", { name: "Open with Metanno", exact: true }).nth(1);
  await savedOutput.waitFor({ timeout: 60000 });
  for (const previewId of [preservedViewer, destinationId]) {
    await page.locator(`[id="${previewId}"]`).getByText("Updated todo", { exact: true }).waitFor({ timeout: 60000 });
  }
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^planner.ipynb$/ })
    .click();
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^Notebook preview$/ })
    .last()
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  await savedOutput.click();
  const annotation = page.getByRole("tabpanel", { name: "Annotation", exact: true });
  const annotationId = await annotation.getAttribute("id");
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  await annotation.getByRole("gridcell", { name: "Updated todo", exact: true }).dblclick();
  const cellEditor = annotation.getByPlaceholder("Type here");
  await cellEditor.fill("Annotation edit");
  await annotation.evaluate((panel) => {
    window.annotationRefresh = {
      blank: false,
      reverted: false,
      saving: true,
      grid: panel.querySelector('[role="grid"]'),
    };
    window.annotationObserver = new MutationObserver(() => {
      const grid = panel.querySelector('[role="grid"]');
      if (grid !== window.annotationRefresh.grid || !grid.querySelector('[role="gridcell"]')?.textContent)
        window.annotationRefresh.blank = true;
      if (
        window.annotationRefresh.saving &&
        [...grid.querySelectorAll('[role="gridcell"]')].some((cell) => cell.textContent === "Updated todo")
      )
        window.annotationRefresh.reverted = true;
    });
    window.annotationObserver.observe(panel, { childList: true, subtree: true, characterData: true });
  });
  await cellEditor.press("Enter");
  await annotation.getByRole("gridcell", { name: "Annotation edit", exact: true }).waitFor();
  await page.waitForFunction(() => {
    const controllers = [...(window.__pret_store_docs__?.values() ?? [])]
      .map((doc) => doc.__pret_controller__)
      .filter(Boolean);
    return controllers.length > 0 && controllers.every((controller) => !controller.getSnapshot().pending);
  });
  assert.equal(
    await page.evaluate(() => {
      window.annotationRefresh.saving = false;
      return window.annotationRefresh.reverted;
    }),
    false
  );
  await annotation.getByRole("gridcell", { name: "Annotation edit", exact: true }).press("Control+z");
  await annotation.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor();

  assert.equal(
    await page.evaluate(() => {
      window.annotationObserver.disconnect();
      return window.annotationRefresh.blank;
    }),
    false
  );
  assert.ok(!(await annotation.locator(".metanno-viewer__status").innerText()).includes("Read only"));
  await annotation.getByRole("button", { name: "Change kernel", exact: true }).click();
  const dialog = page.locator(".jp-Dialog");
  await dialog.locator("select").selectOption(JSON.stringify({ name: "python3" }));
  await dialog.getByRole("button", { name: /^Select(?: Kernel)?$/ }).click();
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForFunction(
    (id) => !document.getElementById(id).querySelector(".metanno-viewer__pret-host").inert,
    annotationId
  );
  const independent = await (await fetch(base + "/api/sessions")).json();
  assert.equal(independent.length, sessions.length + 1);
  assert.notEqual(independent.find((session) => session.type === "console").kernel.id, sessions[0].kernel.id);
  await annotation.getByRole("button", { name: "Reload view", exact: true }).click();
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForFunction(
    (id) => !document.getElementById(id).querySelector(".metanno-viewer__status").textContent.includes("Opening view"),
    annotationId
  );
  // The recipe selector of the tab renders another view
  const annotationRecipe = annotation.getByRole("combobox", { name: "View recipe" });
  await expect(annotationRecipe).toHaveValue("review:main");
  await annotationRecipe.selectOption("alternate");
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  await expect(annotationRecipe).toHaveValue("alternate");
  await expect(annotationRecipe).toBeEnabled();
  await page.evaluate(() => window.jupyterapp.shell.currentWidget.context.restartKernel());
  await page.waitForFunction(
    (id) => document.getElementById(id).querySelector(".metanno-viewer__pret-host").inert,
    annotationId
  );
  await annotation.getByRole("button", { name: "Reload view", exact: true }).click();
  await annotation.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  await page.waitForFunction(
    (id) => !document.getElementById(id).querySelector(".metanno-viewer__pret-host").inert,
    annotationId
  );
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^Annotation$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  assert.equal((await (await fetch(base + "/api/sessions")).json()).length, independent.length);
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^planner.ipynb$/ })
    .click();
  await page.locator(".jp-Notebook .jp-CodeCell").first().click();
  await page.evaluate(async () => {
    await window.jupyterapp.shell.currentWidget.sessionContext.ready;
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  await page.waitForFunction(() => document.querySelector(".jp-CodeCell .jp-InputPrompt").textContent.includes("3"));
  await open.click();
  assert.equal(await page.locator(".jp-Dialog").count(), 0);
  await panel.getByText("Example todo", { exact: true }).waitFor({ timeout: 60000 });
  assert.equal(await panel.count(), 1);
  // Rerunning the cell shows its new output in the open panel without clicking the button
  await panel.evaluate((node) => node.setAttribute("data-stale", ""));
  await page.locator(".jp-Notebook .jp-CodeCell").first().click();
  await page.evaluate(() => window.jupyterapp.commands.execute("notebook:run-cell"));
  await panel.and(page.locator(":not([data-stale])")).getByText("Example todo", { exact: true }).waitFor();
  assert.equal(await panel.count(), 1);
  await page.evaluate(() => window.jupyterapp.shell.activateById("metanno-viewer-sidebar"));
  await expect(
    page.locator("#metanno-viewer-sidebar .metanno-viewer__row").filter({ hasText: "Notebook preview" })
  ).toHaveCount(1);
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^planner.ipynb$/ })
    .click();
  await page.locator(".jp-Notebook .jp-CodeCell").nth(2).click();
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  await page.getByRole("button", { name: "Open with Metanno", exact: true }).nth(2).click({ timeout: 60000 });
  const related = page.getByRole("tabpanel", { name: "Related preview", exact: true });
  await related.getByRole("gridcell", { name: "Source todo", exact: true }).waitFor({ timeout: 60000 });
  await related.getByRole("gridcell", { name: "Related", exact: true }).click();
  await related.locator(".metanno-text-view").getByText("text", { exact: false }).waitFor();
  assert.equal(await related.getByRole("gridcell", { name: "Other", exact: true }).count(), 0);
  // A text selection stays highlighted when spans use other column names than begin and end
  await related.locator(".metanno-text-view").evaluate((view) => {
    const content = [...view.querySelectorAll(".text-chunk-content")].find((node) => node.textContent.includes("text"));
    const range = document.createRange();
    const offset = content.firstChild.textContent.indexOf("text");
    range.setStart(content.firstChild, offset);
    range.setEnd(content.firstChild, offset + 4);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    view.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await related.locator(".metanno-text-view .mouse_selected").waitFor();
  // Hidden viewers stay open while visible viewers can receive outputs from another notebook
  const originalViewer = await related.getAttribute("id");
  await page.evaluate(async () => {
    const notebook = await window.jupyterapp.commands.execute("docmanager:open", { path: "second.ipynb" });
    await notebook.sessionContext.ready;
    await notebook.sessionContext.session.kernel.info;
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  const second = page.getByRole("tabpanel", { name: "second.ipynb", exact: true });
  await second.getByRole("button", { name: "Open with Metanno", exact: true }).click({ timeout: 60000 });
  await page
    .getByRole("tabpanel", { name: "Second preview", exact: true })
    .getByText("Example todo", { exact: true })
    .waitFor();
  assert.equal(await page.locator(`[id="${originalViewer}"]`).count(), 1);
  const secondViewer = await page.evaluate(() => window.jupyterapp.shell.currentWidget.id);
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("docmanager:open", { path: "planner.ipynb" });
  });
  await page
    .getByRole("tabpanel", { name: "planner.ipynb", exact: true })
    .getByRole("button", { name: "Open with Metanno", exact: true })
    .nth(2)
    .click();
  await page.waitForFunction((id) => window.jupyterapp.shell.currentWidget.id !== id, originalViewer);
  assert.equal(await page.locator(`[id="${originalViewer}"]`).count(), 1);
  assert.equal(await page.locator(`[id="${secondViewer}"]`).count(), 0);
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^second.ipynb$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  const saveSecond = page.locator(".jp-Dialog").getByRole("button", { name: "Save", exact: true });
  if (await saveSecond.count()) await saveSecond.click();
  const relatedTabs = page.locator(".lm-TabBar-tab").filter({ hasText: /^Related preview$/ });
  while (await relatedTabs.count()) await relatedTabs.first().locator(".lm-TabBar-tabCloseIcon").click();
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^planner.ipynb$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  const save = page.locator(".jp-Dialog").getByRole("button", { name: "Save", exact: true });
  if (await save.count()) await save.click();
  const survivingKernels = await (await fetch(base + "/api/kernels")).json();
  assert.ok(
    survivingKernels.some((kernel) => kernel.id === sessions.find((session) => session.type === "notebook").kernel.id)
  );
  // Catalogue browsing replaces only the Explore preview and keeps sidebar state
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("metanno-viewer:open-resource");
  });
  const sidebar = page.locator("#metanno-viewer-sidebar");
  await sidebar.getByRole("button", { name: "Open configuration", exact: true }).click();
  await page.getByRole("tab", { name: /metanno.yaml/ }).waitFor();
  await showSidebar(page);
  await sidebar.getByRole("button", { name: "Reload configuration", exact: true }).click();
  // Annotation files of a campaign folder are listed under its name
  const campaign = sidebar
    .getByRole("region", { name: "Annotations" })
    .locator(".metanno-viewer__group")
    .filter({ has: page.getByRole("button", { name: "campaign", exact: true }) });
  await campaign.getByRole("button", { name: /alice/ }).waitFor();
  await campaign.getByRole("button", { name: "campaign", exact: true }).click();
  assert.equal(await campaign.getByRole("button", { name: /alice/ }).count(), 0);
  await campaign.getByRole("button", { name: "campaign", exact: true }).click();
  const annotationEntry = sidebar
    .locator(".metanno-viewer__row")
    .filter({ hasText: "Annotation" })
    .getByRole("button", { name: /^Annotation/ });
  await annotationEntry.click();
  const reopened = page.getByRole("tabpanel", { name: "Annotation", exact: true });
  await reopened.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  // A view chosen in the tab is saved in the Store metadata, the sidebar opens the Annotation with it again
  await expect(reopened.getByRole("combobox", { name: "View recipe" })).toHaveValue("alternate");
  await reopened.getByRole("combobox", { name: "View recipe" }).selectOption("review");
  await reopened.getByText("Updated todo", { exact: true }).waitFor({ timeout: 120000 });
  const reopenedSessions = await (await fetch(base + "/api/sessions")).json();
  const annotationPath = `.metanno-viewer/annotations/${encodeURIComponent(path.join(directory, "review.pret"))}`;
  assert.equal(reopenedSessions.filter((session) => session.path === annotationPath).length, 1);
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^Annotation$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  await annotationEntry.click();
  await reopened.getByText("Updated todo", { exact: true }).waitFor({ timeout: 60000 });
  await expect(reopened.getByRole("combobox", { name: "View recipe" })).toHaveValue("review");
  // A tab removed from the dock without being disposed is opened again rather than focused
  const detachedId = await reopened.getAttribute("id");
  await page.evaluate((id) => {
    const iterator = window.jupyterapp.shell.widgets("main");
    let next;
    while ((next = iterator.next()) && !next.done) {
      const widget = next.value ?? next;
      if (widget.id === id) widget.parent = null;
    }
  }, detachedId);
  await reopened.waitFor({ state: "detached" });
  await annotationEntry.click();
  await reopened.getByText("Updated todo", { exact: true }).waitFor({ timeout: 60000 });
  const reusedSessions = await (await fetch(base + "/api/sessions")).json();
  assert.deepEqual(
    reusedSessions.map((session) => session.id).sort(),
    reopenedSessions.map((session) => session.id).sort()
  );
  await reopened.getByRole("gridcell", { name: "Updated todo", exact: true }).dblclick();
  await reopened.getByPlaceholder("Type here").fill("Reopened edit");
  await reopened.getByPlaceholder("Type here").press("Enter");
  await reopened.getByRole("gridcell", { name: "Reopened edit", exact: true }).waitFor();
  await page.waitForFunction(() => {
    const controllers = [...(window.__pret_store_docs__?.values() ?? [])]
      .map((doc) => doc.__pret_controller__)
      .filter(Boolean);
    return controllers.length > 0 && controllers.every((controller) => !controller.getSnapshot().pending);
  });
  await reopened.getByRole("gridcell", { name: "Reopened edit", exact: true }).press("Control+z");
  await reopened.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor();
  await page
    .locator(".lm-TabBar-tab")
    .filter({ hasText: /^Annotation$/ })
    .locator(".lm-TabBar-tabCloseIcon")
    .click();
  await sidebar.getByRole("button", { name: "fixture", exact: false }).click({ timeout: 60000 });
  const todosEntry = sidebar
    .locator(".metanno-viewer__row")
    .filter({ has: page.getByTitle("fixture.todos", { exact: true }) });
  const listsEntry = sidebar
    .locator(".metanno-viewer__row")
    .filter({ has: page.getByRole("button", { name: "lists", exact: true }) });
  await todosEntry.getByRole("button", { name: "todos", exact: true }).click();
  let sourceView = page.locator(".metanno-viewer-widget:visible");
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
  // The recipe selector shows the tables of the saved view with the table view, then with its own recipe again
  const sourceRecipe = sourceView.getByRole("combobox", { name: "View recipe" });
  await expect(sourceRecipe).toHaveValue("review");
  await sourceRecipe.selectOption("table");
  await expect(sourceRecipe).toHaveValue("table");
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".metanno-viewer-widget input, .metanno-viewer-widget textarea")].some((input) => input.value === "todos source row")
  );
  assert.equal(await sourceView.locator(".metanno-viewer__error").count(), 0);
  await sourceRecipe.selectOption("review");
  await expect(sourceRecipe).toHaveValue("review");
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
  assert.equal(await sourceView.locator(".metanno-viewer__sidebar").count(), 0);
  await listsEntry.getByRole("button", { name: "lists", exact: true }).click();
  await sourceView.getByRole("gridcell", { name: "lists source row", exact: true }).waitFor();
  assert.equal(await page.locator(".metanno-viewer-widget").count(), 1);
  // A source table opens with the table view, the recipe chosen for the previous selection does not carry over
  await expect(sourceRecipe).toHaveValue("table");
  // A recipe that cannot show this table reports why and stays selected, so the table view can be chosen again
  await sourceRecipe.selectOption("todo_tags");
  await sourceView.locator(".metanno-viewer__error").waitFor();
  await expect(sourceRecipe).toHaveValue("todo_tags");
  await sourceRecipe.selectOption("table");
  await sourceView.getByRole("gridcell", { name: "lists source row", exact: true }).waitFor();
  assert.equal(await sourceView.locator(".metanno-viewer__error").count(), 0);
  // The default view of a source table shows the fields of the selected rows in a form beside the table
  await sourceView.getByRole("gridcell", { name: "lists source row", exact: true }).click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".metanno-viewer-widget input, .metanno-viewer-widget textarea")].some((input) => input.value === "lists source row")
  );
  // Replacing a moved preview preserves its dock location and releases a late opening reply
  const sourceId = await sourceView.getAttribute("id");
  await page.evaluate((id) => {
    const app = window.jupyterapp;
    const widgets = [];
    const iterator = app.shell.widgets("main");
    let next;
    while ((next = iterator.next()) && !next.done) widgets.push(next.value ?? next);
    const widget = widgets.find((widget) => widget.id === id);
    const reference = widgets.find((widget) => widget.id !== id);
    app.shell.add(widget, "main", { ref: reference.id, mode: "split-bottom" });
  }, sourceId);
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const movedPosition = await dockPath(sourceId);
  const holdOpen = path.join(directory, "hold-open.txt");
  fs.writeFileSync(holdOpen, "hold");
  await todosEntry.getByRole("button", { name: "todos", exact: true }).click();
  await page.waitForFunction(async () => (await fetch("/files/pending-open.txt")).ok);
  await listsEntry.getByRole("button", { name: "lists", exact: true }).click();
  fs.unlinkSync(holdOpen);
  await sourceView.getByRole("gridcell", { name: "lists source row", exact: true }).waitFor();
  assert.deepEqual(await dockPath(await sourceView.getAttribute("id")), movedPosition);
  await page.waitForFunction(async () => (await (await fetch("/files/views-count.txt")).text()).trim() === "1");
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("launcher:create");
  });
  await page.locator(".jp-Launcher:visible .jp-LauncherCard").first().focus();
  await todosEntry.getByRole("button", { name: "todos", exact: true }).click();
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
  assert.equal(await page.locator(".metanno-viewer-widget").count(), 2);
  await todosEntry.getByRole("button", { name: "todos", exact: true }).click();
  assert.equal(await page.locator(".metanno-viewer-widget").count(), 2);
  await todosEntry.getByRole("button", { name: "Open in new tab", exact: true }).click();
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
  assert.equal(await page.locator(".metanno-viewer-widget").count(), 3);
  await sidebar.getByRole("textbox", { name: "Search sources and tables" }).fill("todos");
  await todosEntry.getByRole("button", { name: "todos", exact: true }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Open in new tab", exact: true }).click();
  await sourceView.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
  assert.equal(await page.locator(".metanno-viewer-widget").count(), 4);
  assert.equal(await sidebar.getByRole("textbox", { name: "Search sources and tables" }).inputValue(), "todos");
});

test("missing kernel recovery", async ({ page }) => {
  test.setTimeout(180000);
  const { base, configurationPath, sourceConfiguration } = await openExplorer(page, { missing: true });
  // Include the notebook kernel in the baseline before checking for unwanted sessions
  await page.evaluate(() => window.jupyterapp.shell.currentWidget.sessionContext.ready);
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("metanno-viewer:open-resource");
  });
  const sidebar = page.locator("#metanno-viewer-sidebar");
  await sidebar.getByText("The Jupyter server cannot find", { exact: false }).waitFor();
  assert.equal(await page.locator(".jp-Dialog").count(), 0);
  let sessions = await (await fetch(base + "/api/sessions")).json();
  assert.ok(!sessions.some((session) => session.kernel.name === "metanno-explorer"));
  await page.evaluate(() =>
    window.jupyterapp.commands.execute("metanno-viewer:open-resource", {
      resource: { kind: "table", source: "fixture", table: "todos" },
    })
  );
  const source = page.locator(".metanno-viewer-widget");
  await source.getByText("The Jupyter server cannot find", { exact: false }).waitFor();
  await sidebar.getByRole("button", { name: "Open configuration", exact: true }).click();
  await page.locator(".lm-TabBar-tabLabel").getByText("metanno.yaml", { exact: true }).waitFor();
  assert.equal(fs.readFileSync(configurationPath, "utf8"), "connections: {}\nsources: {}\n");
  await page.evaluate(async () => {
    const context = window.jupyterapp.shell.currentWidget.context;
    await context.ready;
    context.model.fromString("[invalid");
    await context.save();
  });
  await showSidebar(page);
  await sidebar.getByRole("button", { name: "Open configuration", exact: true }).click();
  assert.equal(fs.readFileSync(configurationPath, "utf8"), "[invalid");
  await page.evaluate(async () => {
    const context = window.jupyterapp.shell.currentWidget.context;
    await context.ready;
    context.model.fromString("connections: {}\nsources: {}\n");
    await context.save();
  });

  assert.deepEqual(
    (await (await fetch(base + "/api/sessions")).json()).map((session) => session.id).sort(),
    sessions.map((session) => session.id).sort()
  );
  fs.writeFileSync(configurationPath, sourceConfiguration);
  await page.unroute("**/api/kernelspecs*");
  await showSidebar(page);
  await sidebar.getByRole("button", { name: "Retry", exact: true }).click();
  await sidebar.getByRole("button", { name: "fixture", exact: false }).waitFor({ timeout: 60000 });
  assert.equal(await sidebar.locator(".metanno-viewer__error").count(), 0);
  await page.evaluate((id) => window.jupyterapp.shell.activateById(id), await source.getAttribute("id"));
  await source.getByRole("button", { name: "Refresh", exact: true }).click();
  const row = source.getByRole("gridcell", { name: "todos source row", exact: true });
  await row.waitFor();
  await row.evaluate((cell) => cell.setAttribute("data-stale", ""));
  sessions = await (await fetch(base + "/api/sessions")).json();
  const explorer = sessions.find((session) => session.kernel.name === "metanno-explorer");
  await fetch(`${base}/api/sessions/${explorer.id}`, { method: "DELETE" });
  // Reloading the sidebar starts a new kernel, the open table reopens on it
  await sidebar.getByRole("button", { name: "Reload configuration", exact: true }).click();
  await sidebar.getByText("fixture", { exact: true }).waitFor();
  await row.and(page.locator(":not([data-stale])")).waitFor({ timeout: 90000 });
});

test("connection per database", async ({ page }) => {
  test.setTimeout(180000);
  const { configurationPath } = await openExplorer(page);
  fs.writeFileSync(
    configurationPath,
    "connections:\n" +
      "  local:\n    factory: explorer_connections:connect\n" +
      "  spare:\n    factory: explorer_connections:connect\n" +
      "sources:\n" +
      "  fixture:\n    connection: local  # the usual one\n    connections: [local, spare]\n" +
      "  everything:\n    connection: spare\n    kind: databases\n"
  );
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("metanno-viewer:open-resource");
  });
  const sidebar = page.locator("#metanno-viewer-sidebar");
  await sidebar.getByRole("button", { name: "Reload configuration", exact: true }).click();
  // Rows of a source group with the rows listed under it once opened
  const group = (name) =>
    sidebar
      .locator(".metanno-viewer__group")
      .filter({ has: page.getByRole("button", { name, exact: true }) })
      .first();
  const everything = group("everything");
  assert.equal(await everything.locator(".metanno-viewer__group").count(), 0);
  await everything.getByRole("button", { name: "everything", exact: true }).click();
  const listed = everything.locator(".metanno-viewer__group").first();
  await listed.waitFor({ timeout: 60000 });
  await expect(everything.locator(".metanno-viewer__count")).toContainText("databases");
  const listedRow = listed.locator(".metanno-viewer__row-button").first();
  await listedRow.click();
  await listed.getByRole("button", { name: "lists", exact: true }).waitFor({ timeout: 60000 });
  const searchBox = sidebar.getByRole("textbox", { name: "Search sources and tables" });
  await searchBox.fill("lists");
  await expect(listed.getByRole("button", { name: "lists", exact: true })).toBeVisible();
  await expect(listed.getByRole("button", { name: "todos", exact: true })).toHaveCount(0);
  await searchBox.fill("");
  await listedRow.click();
  const fixture = group("fixture");
  const label = fixture.locator(".metanno-viewer__connection");
  await expect(label).toHaveText("local");
  await label.click();
  await page
    .locator(".lm-Menu .lm-Menu-itemLabel")
    .filter({ hasText: /^spare$/ })
    .click();
  await expect(label).toHaveText("spare");
  await expect.poll(() => fs.readFileSync(configurationPath, "utf8")).toContain("connection: spare  # the usual one");
  await fixture.getByRole("button", { name: "fixture", exact: true }).click();
  await fixture.getByRole("button", { name: "todos", exact: true }).click();
  const view = page.locator(".metanno-viewer-widget:visible");
  await view.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
  const connection = view.getByRole("combobox", { name: "Connection" });
  await expect(connection).toHaveValue("spare");
  await connection.selectOption("local");
  await expect(connection).toHaveValue("local");
  await view.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
});

test("folder tree of a file source", async ({ page }) => {
  test.setTimeout(180000);
  const { directory, configurationPath } = await openExplorer(page);
  // tree/notes is a dataset, tree/runs/2024/acts a dataset two folders down
  const root = path.join(directory, "tree");
  execFileSync(process.env.PYTHON, [
    "-c",
    "import pathlib, sys, pyarrow as pa, pyarrow.parquet as pq\n" +
      "root = pathlib.Path(sys.argv[1])\n" +
      "for folder in ('runs/2024/acts', 'notes'):\n" +
      "    (root / folder).mkdir(parents=True, exist_ok=True)\n" +
      "pq.write_table(pa.table({'act': ['tree act']}), root / 'runs/2024/acts/part-00000.parquet')\n" +
      "pq.write_table(pa.table({'note': ['tree note']}), root / 'notes/part-00000.parquet')\n" +
      "(root / 'notes/_SUCCESS').touch()\n",
    root,
  ]);
  fs.writeFileSync(
    configurationPath,
    `connections:\n  local:\n    url: "duckdb://"\nsources:\n  tree:\n    connection: local\n    kind: files\n    uri: ${root}\n` +
      `  broken:\n    connection: local\n    kind: files\n    uri: ${root}-missing\n`
  );
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("metanno-viewer:open-resource");
  });
  const sidebar = page.locator("#metanno-viewer-sidebar");
  await sidebar.getByRole("button", { name: "Reload configuration", exact: true }).click();
  await sidebar.getByRole("button", { name: "tree", exact: true }).click();
  const tables = sidebar
    .locator(".metanno-viewer__group")
    .filter({ has: page.getByRole("button", { name: "tree", exact: true }) });
  await tables.getByRole("button", { name: "notes", exact: true }).waitFor({ timeout: 60000 });
  // Folders open in place, listing their own datasets and subfolders
  await tables.locator('button[title="runs"]').click();
  await tables.locator('button[title="runs/2024"]').click();
  const acts = tables.locator('button[title="runs/2024/acts"]');
  await acts.waitFor({ timeout: 60000 });
  await expect(acts).toHaveText("acts");
  // The search keeps the folders leading to a matching table
  const searchBox = sidebar.getByRole("textbox", { name: "Search sources and tables" });
  await searchBox.fill("acts");
  await expect(acts).toBeVisible();
  await expect(tables.getByRole("button", { name: "notes", exact: true })).toHaveCount(0);
  await searchBox.fill("");
  await acts.click();
  const view = page.locator(".metanno-viewer-widget:visible");
  await view.getByRole("gridcell", { name: "tree act", exact: true }).waitFor({ timeout: 60000 });
  // A source whose folder cannot be listed shows the error under its row
  await sidebar.getByRole("button", { name: "broken", exact: true }).click();
  const broken = sidebar
    .locator(".metanno-viewer__group")
    .filter({ has: page.getByRole("button", { name: "broken", exact: true }) });
  await broken.getByRole("alert").waitFor({ timeout: 60000 });
  await broken.getByRole("button", { name: "Dismiss error", exact: true }).click();
  await expect(broken.getByRole("alert")).toHaveCount(0);
});
