let { expect, test } = require("@jupyterlab/galata");
const { createDirectoryResetController, addCodeCell } = require("../utils.js");

// JUPYTERLAB_VERSION is set in run.sh
if (process.env.JUPYTERLAB_VERSION < "4") {
  console.log("Using old galata to match JupyterLab 3");
  const oldGalata = require("old-galata");
  expect = oldGalata.expect;
  test = oldGalata.test;
}

const directoryReset = createDirectoryResetController(__dirname);

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await directoryReset.prepare();
  await directoryReset.reset();
});

test.beforeEach(async () => {
  await directoryReset.reset();
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({
      name: "screenshot",
      path: screenshotPath,
      contentType: "image/png",
    });
    try {
      // Take the screenshot itself.
      await page.screenshot({ path: screenshotPath, timeout: 1000 });
    }
    catch (e) {
      console.error("Could not create screenshot");
    }
  }

  await directoryReset.reset();
});

test.afterAll(async () => {
  await directoryReset.dispose();
});

test.describe("Quaero Explorer Tests", () => {
  test("Should render Quaero Dataset Explorer", async ({ page }) => {
    const fileName = "quaero_app/Quaero.ipynb";
    await page.notebook.openByPath(fileName);
    await page.waitForSelector(
      ".jp-Notebook-ExecutionIndicator[data-status=idle]"
    );

    await page.waitForTimeout(1000);
    await page.notebook.runCellByCell();
    await page.waitForTimeout(500);
    await page.waitForSelector(
      ".jp-OutputArea-output >> text=The BRAT directory contains",
      { timeout: 30000 }
    );

    // Await for the main Metanno/Pret container to appear
    const mainView = await page.waitForSelector(".pret-view");
    expect(mainView).toBeTruthy();
    await page.waitForTimeout(1000);

    // Check for the Main Header: "Quaero Dataset Explorer"
    const title = await page
      .locator(".pret-view")
      .getByText("Quaero Dataset Explorer")
      .first();
    await expect(title).toBeVisible();

    // Check for the "Notes" panel table headers
    const tableHeader = await page
      .locator(".pret-view")
      .getByText("note_id")
      .first();
    await expect(tableHeader).toBeVisible();

    // Check for Entity Tags in the right panel (e.g., "CHEM", "PROC")
    const chemBadge = await page
      .locator(".pret-view")
      .getByText("CHEM")
      .first();
    await expect(chemBadge).toBeVisible();

    // Check for specific text content shown in the visualizer
    const contentText = await page
      .locator(".pret-view")
      .getByText("EPIVIR")
      .first();
    await expect(contentText).toBeVisible();

    // Update the app from Python
    const highlightCellIndex = await addCodeCell(
      page,
      ".jp-NotebookPanel:not(.lm-mod-hidden)",
      'handles["notes"].current.set_highlighted("dev/EMEA/118_2")'
    );
    await page.notebook.runCell(highlightCellIndex, true);
    const highlighted = await page.waitForSelector(
      ".metanno-table > div > .rdg-row:nth-child(4).metanno-row--highlighted"
    );
    expect(highlighted).toBeTruthy();

    const checkbox = page
      .locator("label", { hasText: "seen" })
      .locator('+span input[type="checkbox"]');
    await checkbox.waitFor({ state: "visible" });
    await checkbox.click();
    const snapshotCellIndex = await addCodeCell(
      page,
      ".jp-NotebookPanel:not(.lm-mod-hidden)",
      'import pret\nprint(pret.load_store_snapshot("state.bin")["notes"][0]["seen"])'
    );
    await page.notebook.runCell(snapshotCellIndex, true);
    await expect(
      page.locator(
        `:nth-match(.jp-Cell, ${snapshotCellIndex + 1}) .jp-OutputArea-output pre`
      )
    ).toHaveText("True");

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});
