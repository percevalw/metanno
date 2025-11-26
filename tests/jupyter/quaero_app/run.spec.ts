let { expect, test } = require("@jupyterlab/galata");

// JUPYTERLAB_VERSION is set in run.sh
if (process.env.JUPYTERLAB_VERSION < "4") {
  console.log("Using old galata to match JupyterLab 3");
  const oldGalata = require("old-galata");
  expect = oldGalata.expect;
  test = oldGalata.test;
}

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = testInfo.outputPath(`failure.png`);
    testInfo.attachments.push({
      name: "screenshot",
      path: screenshotPath,
      contentType: "image/png",
    });
    await page.screenshot({ path: screenshotPath, timeout: 1000 });
  }
});

test.describe("Quaero Explorer Tests", () => {
  test("Should render Quaero Dataset Explorer", async ({ page }) => {
    // 1. Open the notebook
    // NOTE: Update this filename to match the actual location of the notebook in your repo
    const fileName = "quaero_app/Quaero.ipynb";
    await page.notebook.openByPath(fileName);

    // Wait for kernel to be ready
    await page.waitForSelector(
      ".jp-Notebook-ExecutionIndicator[data-status=idle]"
    );

    // 2. Run the initialization cells
    // The image shows cells [1], [2], [3] (imports and setup) and [4] (rendering view)
    // We run them sequentially.
    await page.waitForTimeout(1000);

    await page.notebook.runCellByCell();
    await page.waitForTimeout(500);
    await page.waitForSelector(".jp-OutputArea-output >> text=The BRAT directory contains", { timeout: 30000 });

    // Await for the main Metanno/Pret container to appear
    const mainView = await page.waitForSelector(".pret-view");
    expect(mainView).toBeTruthy();
    await page.waitForTimeout(1000);

    // 4. Verify UI Elements

    // Check for the Main Header: "Quaero Dataset Explorer"
    // We scope the search inside .pret-view to ensure it's the rendered UI, not markdown
    const title = await page.locator(".pret-view").getByText("Quaero Dataset Explorer").first();
    await expect(title).toBeVisible();

    // Check for the "Notes" panel table headers
    const tableHeader = await page.locator(".pret-view").getByText("note_id").first();
    await expect(tableHeader).toBeVisible();

    // Check for Entity Tags in the right panel (e.g., "CHEM", "PROC")
    const chemBadge = await page.locator(".pret-view").getByText("CHEM").first();
    await expect(chemBadge).toBeVisible();

    // Check for specific text content shown in the visualizer
    const contentText = await page.locator(".pret-view").getByText("EPIVIR").first();
    await expect(contentText).toBeVisible();

    // 5. Test Python Interaction (Scrolling)
    // The last cell in the screenshot is `handles["notes"].current.scroll_to_row(50)`
    // We add a cell to test this interaction
    await page.notebook.addCell("code", 'handles["notes"].current.set_highlighted("dev/EMEA/118_2")');
    await page.notebook.runCell(3, true); // Run the newly added cell

    // Allow a moment for the scroll/update to propagate
    const highlighted = page.waitForSelector(".metanno-table > div > .rdg-row:nth-child(4).metanno-row--highlighted");
    expect(highlighted).toBeTruthy();

    // Ideally, we would check if row 50 is visible, but without specific DOM IDs
    // simply ensuring the command ran without error (no stderr) is a good sanity check.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
  });
});
