import assert from "node:assert/strict";
import path from "node:path";
import { openExplorer, openNotebookPreview } from "./explorer";
const { test, getMainWidget } = require(process.env.PRET_TESTING_HELPER);

test.use({ viewport: { width: 1600, height: 1000 } });

test("fullscreen links", async ({ page }) => {
  test.setTimeout(300000);
  const { directory } = await openExplorer(page);
  await openNotebookPreview(page);
  await page
    .locator(".metanno-viewer__application")
    .getByRole("button", { name: "Open notebook", exact: true })
    .click();
  await page.locator(".jp-Notebook .jp-CodeCell").nth(1).click();
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  await page.getByRole("button", { name: "Open with Metanno", exact: true }).nth(1).click();
  const annotation = page.getByRole("tabpanel", { name: "Annotation", exact: true });
  await annotation.getByText("Updated todo", { exact: true }).waitFor();
  const annotationId = await annotation.getAttribute("id");
  const panel = page.locator(`[id="${annotationId}"]`);
  const widget = await getMainWidget(page, annotationId);
  const restoration = await page.evaluate((widget) => widget.restoreData().args, widget);
  await widget.dispose();
  // Record the active Annotation tab before entering fullscreen history
  await page.evaluate((id) => window.jupyterapp.shell.activateById(id), annotationId);
  await page.waitForURL((url) => url.pathname.endsWith("/lab"));
  const before = page.url();
  const basePath = new URL(before).pathname.split("/lab")[0];
  const fullscreen = page.locator(".metanno-viewer__fullscreen");
  assert.equal(await panel.getByRole("button", { name: "Change kernel", exact: true }).innerText(), "python3");
  await panel.getByRole("button", { name: "Enter fullscreen", exact: true }).click();
  await fullscreen.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor();
  const url = page.url();
  assert.ok(new URL(url).searchParams.has("metanno-fullscreen"));
  assert.equal(new URL(url).searchParams.get("metanno-fullscreen"), `annotation:${directory}/review.pret`);
  assert.equal(await fullscreen.getByRole("button", { name: "Exit fullscreen", exact: true }).count(), 1);
  assert.deepEqual(await fullscreen.boundingBox(), { x: 0, y: 0, width: 1600, height: 1000 });

  await fullscreen.getByRole("button", { name: "Change kernel", exact: true }).click();
  const dialog = page.locator(".jp-Dialog");
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
  await fullscreen.getByRole("button", { name: "Reload view", exact: true }).click();
  await fullscreen.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor();
  await page.goBack();
  await fullscreen.waitFor({ state: "detached" });
  assert.equal(page.url(), before);
  await page.goForward();
  await fullscreen.getByRole("button", { name: "Exit fullscreen", exact: true }).waitFor();
  await page.evaluate(() => {
    window.fullscreenGrid = document.querySelector(".metanno-viewer__fullscreen [role=grid]");
    window.location.hash = "/documents/42";
  });
  await page.waitForFunction(() => window.location.hash === "#/documents/42");
  assert.equal(
    new URL(page.url()).searchParams.get("metanno-fullscreen"),
    new URL(url).searchParams.get("metanno-fullscreen")
  );
  await page.goBack();
  await fullscreen.getByRole("button", { name: "Exit fullscreen", exact: true }).waitFor();
  await page.goForward();
  assert.equal(
    await page.evaluate(
      () => window.fullscreenGrid === document.querySelector(".metanno-viewer__fullscreen [role=grid]")
    ),
    true
  );
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("filebrowser:go-to-path", { path: "metanno-home/views" });
  });
  assert.ok(new URL(page.url()).searchParams.has("metanno-fullscreen"), "File browser navigation preserves fullscreen");
  assert.equal(new URL(page.url()).hash, "#/documents/42");
  const normal = new URL(page.url());
  normal.searchParams.delete("metanno-fullscreen");
  await fullscreen.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
  assert.equal(page.url(), normal.toString());
  await panel.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor();
  await panel.getByRole("button", { name: "Enter fullscreen", exact: true }).click();
  await fullscreen.getByRole("button", { name: "Open notebook", exact: true }).click();
  await fullscreen.waitFor({ state: "detached" });
  await page.locator(".jp-NotebookPanel:visible").waitFor();

  const direct = await page.context().newPage();
  try {
    const shared = new URL(url);
    shared.pathname = `${basePath}/lab/workspaces/fullscreen-direct`;
    shared.hash = "/documents/42";
    await direct.goto(shared.toString());
    const view = direct.locator(".metanno-viewer__fullscreen");
    await view.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
    const dismiss = direct.getByRole("button", { name: "Dismiss", exact: true });
    if (await dismiss.count()) await dismiss.click();
    const news = direct.getByRole("button", { name: "No", exact: true });
    if (await news.count()) await news.click();
    assert.equal(await view.locator(".metanno-viewer__status").isVisible(), false);
    assert.equal(await direct.locator("#main").isVisible(), false);
    assert.equal(new URL(direct.url()).hash, "#/documents/42");
    assert.equal(new URL(direct.url()).searchParams.get("metanno-fullscreen"), `annotation:${directory}/review.pret`);
    await view.getByRole("gridcell", { name: "Updated todo", exact: true }).dblclick();
    await view.getByPlaceholder("Type here").waitFor();
    await direct.keyboard.press("Escape");
    await direct.reload();
    await view.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
    assert.equal(await view.locator(".metanno-viewer__status").isVisible(), false);
    assert.equal(new URL(direct.url()).hash, "#/documents/42");
  } catch (error) {
    console.error(await direct.locator("body").innerText());
    await direct.screenshot({ path: path.join(directory, "fullscreen-direct-failure.png") });
    throw error;
  } finally {
    await direct.close();
  }
  // Saved Store links also open after the original notebook session has stopped
  const api = new URL(`${basePath}/api/sessions`, url);
  api.searchParams.set("token", "python3");
  const sessions = await (await page.request.get(api.toString())).json();
  const session = sessions.find((item) => item.path === restoration.sessionPath);
  api.pathname += `/${session.id}`;
  assert.ok((await page.request.delete(api.toString())).ok());
  const fresh = await page.context().newPage();
  try {
    const shared = new URL(url);
    shared.pathname = `${basePath}/lab/workspaces/fullscreen-fresh-kernel`;
    await fresh.goto(shared.toString());
    const view = fresh.locator(".metanno-viewer__fullscreen");
    await view.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
    assert.equal(await view.locator(".metanno-viewer__status").isVisible(), false);
  } finally {
    await fresh.close();
  }
  for (const resource of [
    { kind: "table", source: "fixture", table: "todos" },
    { kind: "view", name: "todos" },
  ]) {
    const id = await page.evaluate(
      async (resource) =>
        (
          await window.jupyterapp.commands.execute("metanno-viewer:open-resource", { resource, newTab: true })
        ).id,
      resource
    );
    const explorer = page.locator(`[id="${id}"]`);
    await explorer.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
    await explorer.getByRole("button", { name: "Enter fullscreen", exact: true }).click();
    await fullscreen.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
    const shared = new URL(page.url());
    const key = resource.kind === "view" ? "view:todos" : "table:fixture/todos";
    assert.equal(shared.searchParams.get("metanno-fullscreen"), key);
    await fullscreen.getByRole("button", { name: "Refresh", exact: true }).click();
    await fullscreen.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
    await fullscreen.getByRole("button", { name: "Exit fullscreen", exact: true }).click();
    await explorer.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor();
    const direct = await page.context().newPage();
    try {
      shared.pathname = `${basePath}/lab/workspaces/fullscreen-${resource.kind}`;
      await direct.goto(shared.toString());
      const view = direct.locator(".metanno-viewer__fullscreen");
      await view.getByRole("gridcell", { name: "todos source row", exact: true }).waitFor({ timeout: 60000 });
      assert.equal(await view.locator(".metanno-viewer__status").isVisible(), false);
      assert.equal(new URL(direct.url()).searchParams.get("metanno-fullscreen"), key);
    } catch (error) {
      console.error(`Direct ${resource.kind} fullscreen`, await direct.locator("body").innerText());
      await direct.screenshot({ path: path.join(directory, `fullscreen-${resource.kind}-failure.png`) });
      throw error;
    } finally {
      await direct.close();
    }
  }
  const legacy = new URL(url);
  legacy.searchParams.set("metanno-fullscreen", JSON.stringify(restoration));
  await page.goto(legacy.toString());
  await fullscreen.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
  assert.equal(new URL(page.url()).searchParams.get("metanno-fullscreen"), `annotation:${directory}/review.pret`);
  await page.goto(url);
  await fullscreen.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
  assert.equal(await fullscreen.locator(".metanno-viewer__status").isVisible(), false);
  const relative = new URL(url);
  relative.pathname = `${basePath}/lab/workspaces/fullscreen-relative`;
  relative.searchParams.set("metanno-fullscreen", "annotation:review.pret");
  await page.goto(relative.toString());
  await fullscreen.getByRole("gridcell", { name: "Updated todo", exact: true }).waitFor({ timeout: 120000 });
  assert.equal(await fullscreen.locator(".metanno-viewer__status").isVisible(), false);
  assert.equal(new URL(page.url()).searchParams.get("metanno-fullscreen"), `annotation:${directory}/review.pret`);
});
