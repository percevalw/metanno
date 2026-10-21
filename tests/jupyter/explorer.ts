import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const { writeNotebook } = require(process.env.PRET_TESTING_HELPER);

// Prepare real local sources and notebook applications before each Explorer workflow
export async function openExplorer(page, { missing = false, delayed = false } = {}) {
  const directory = process.env.PRET_TEST_ROOT;
  const base = process.env.PRET_TEST_URL.replace(/\/$/, "");
  execFileSync(process.env.PYTHON, [path.join(directory, "explorer_app.py")], { cwd: directory });
  const configurationPath = path.join(directory, "metanno-home", "metanno.yaml");
  const sourceConfiguration = fs.readFileSync(configurationPath, "utf8");
  if (missing) fs.unlinkSync(configurationPath);
  if (delayed) fs.writeFileSync(path.join(directory, "delay-replies"), "");
  await writeNotebook("planner.ipynb", [
    "from explorer_app import open_preview, open_annotation, open_related\nstore = open_preview()",
    "annotation = open_annotation(store)",
    "preview = open_related()",
  ]);
  await writeNotebook("second.ipynb", [
    'from explorer_app import open_preview\nstore = open_preview("Second preview")',
  ]);
  fs.writeFileSync(path.join(directory, "browser.log"), "");
  page.on("console", (message) => fs.appendFileSync(path.join(directory, "browser.log"), message.text() + "\n"));
  page.on("pageerror", (error) => console.error("browser:", error.message));
  if (missing)
    await page.route("**/api/kernelspecs*", async (route) => {
      const response = await route.fetch();
      const specs = await response.json();
      delete specs.kernelspecs["metanno-explorer"];
      await route.fulfill({ response, json: specs });
    });
  await page.goto(base + "/lab/tree/planner.ipynb");
  await page.locator(".jp-Notebook .jp-CodeCell").first().waitFor({ timeout: 60000 });
  const dismiss = page.getByRole("button", { name: "Dismiss", exact: true });
  if (await dismiss.count()) await dismiss.click();
  return { directory, base, configurationPath, sourceConfiguration };
}

// Open a notebook MIME output and check that the view borrows its notebook session
export async function openNotebookPreview(page) {
  const directory = process.env.PRET_TEST_ROOT;
  const base = process.env.PRET_TEST_URL.replace(/\/$/, "");
  await page.locator(".jp-Notebook .jp-CodeCell").first().click();
  await page.evaluate(async () => {
    await window.jupyterapp.shell.currentWidget.sessionContext.ready;
  });
  assert.ok(!fs.readFileSync(path.join(directory, "browser.log"), "utf8").includes("PRET: Requesting comm info"));
  await page.evaluate(async () => {
    await window.jupyterapp.commands.execute("notebook:run-cell");
  });
  const open = page.getByRole("button", { name: "Open with Metanno", exact: true }).first();
  await open.waitFor({ timeout: 60000 });
  await page.locator(".pret-view").getByText("Notebook PRET connection", { exact: true }).waitFor();
  // Removing the notebook output releases its connection before extension hosts acquire it
  await page.evaluate(() => {
    const outputs = window.jupyterapp.shell.currentWidget.content.model.cells.get(0).outputs;
    outputs.fromJSON(outputs.toJSON().filter((output) => !output.data?.["application/vnd.pret+json"]));
  });
  await page.locator(".pret-view").waitFor({ state: "detached" });
  const sessions = await (await fetch(base + "/api/sessions")).json();
  assert.equal(sessions.filter((session) => session.type === "notebook").length, 1);
  await open.click();
  const panel = page.locator(".metanno-viewer__application");
  await panel.getByText("Example todo", { exact: true }).waitFor({ timeout: 60000 });
  assert.match(await panel.locator(".metanno-viewer__status").innerText(), /Read only/);
  assert.equal((await (await fetch(base + "/api/sessions")).json()).length, sessions.length);
  await panel.getByRole("button", { name: "Open notebook", exact: true }).click();
  await open.click();
  assert.equal(await page.locator(".metanno-viewer__application").count(), 1);
  const notebookBounds = await page.locator(".jp-NotebookPanel").boundingBox();
  const viewerBounds = await panel.boundingBox();
  assert.ok(viewerBounds.x >= notebookBounds.x + notebookBounds.width - 2);
  return sessions;
}
