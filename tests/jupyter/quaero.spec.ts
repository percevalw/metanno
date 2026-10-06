const { jupyterTest: test, expect, openNotebook, addCodeCell } = require(process.env.PRET_TESTING_HELPER);

test.describe("Quaero Explorer Tests", () => {
  test("Should render Quaero Dataset Explorer", async ({ page }) => {
    test.setTimeout(180000);
    const fileName = "quaero_app/Quaero.ipynb";
    await openNotebook(page, fileName);
    await page.waitForSelector(".jp-Notebook-ExecutionIndicator[data-status=idle]");

    await page.waitForTimeout(1000);
    await page.notebook.runCellByCell();
    await page.waitForTimeout(500);
    await page.waitForSelector(".jp-OutputArea-output >> text=The BRAT directory contains", { timeout: 30000 });

    const mainView = await page.waitForSelector(".pret-view");
    expect(mainView).toBeTruthy();
    // Suspense hides existing content while the remaining widget bundles load
    await page.locator(".pret-view .loading").waitFor({ state: "detached" });

    const title = await page.locator(".pret-view").getByText("Quaero Dataset Explorer").first();
    await expect(title).toBeVisible();

    const tableHeader = await page.locator(".pret-view").getByText("note_id").first();
    await expect(tableHeader).toBeVisible();

    const chemBadge = await page.locator(".pret-view").getByText("CHEM").first();
    await expect(chemBadge).toBeVisible();

    const contentText = await page.locator(".pret-view").getByText("EPIVIR").first();
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

    // DataFrame tables open without a selected row, select the highlighted note
    await page.locator(".metanno-row--highlighted .rdg-cell").first().click();
    const checkbox = page.locator("label", { hasText: "seen" }).locator('+span input[type="checkbox"]');
    await checkbox.waitFor({ state: "visible" });
    await checkbox.click();
    const snapshotCellIndex = await addCodeCell(
      page,
      ".jp-NotebookPanel:not(.lm-mod-hidden)",
      'import pret\nnotes = pret.load_store_snapshot("state.bin")["notes"].materialize().to_pandas()\n' +
        'print(notes.set_index("note_id").loc["dev/EMEA/118_2", "seen"])'
    );
    await page.notebook.runCell(snapshotCellIndex, true);
    await expect(page.locator(`:nth-match(.jp-Cell, ${snapshotCellIndex + 1}) .jp-OutputArea-output pre`)).toHaveText(
      "True"
    );

    // Next moves the form and the entities table to the following note, like a click in the notes table
    // The output is too short to show entity rows, give the view room for them
    await page.locator(".pret-view").first().evaluate((element) => (element.style.height = "900px"));
    const entityIds = page.locator(".metanno-table").filter({ hasNotText: "note_id" }).getByRole("gridcell", {
      name: /^#/,
    });
    const previousEntity = await entityIds.first().textContent();
    await page.getByRole("button", { name: "Next →" }).click();
    await expect(checkbox).not.toBeChecked();
    await expect(entityIds.first()).toBeVisible();
    await expect(entityIds.filter({ hasText: previousEntity })).toHaveCount(0);

    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
});
