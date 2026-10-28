const assert = require("node:assert/strict");
const { jupyterTest: test, expect, openNotebook, addCodeCell } = require(process.env.PRET_TESTING_HELPER);

// Select rendered document text through the same mouse event used by the annotation tools
async function selectText(page, text) {
  await page.evaluate((text) => {
    const content = [...document.querySelectorAll(".text-chunk-content")].find((node) => node.textContent === text);
    const range = document.createRange();
    range.setStart(content.firstChild, 0);
    range.setEnd(content.firstChild, content.textContent.length);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.querySelector(".metanno-text-view").dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }, text);
}

// Wait for notebook acceptance before requesting another shared history operation
async function undo(page) {
  await page.waitForFunction(() => !historyState.getSnapshot().pending && historyState.canUndo);
  await page.evaluate(() => historyState.undo());
  await page.waitForFunction(() => !historyState.getSnapshot().pending);
}

for (const kind of ["dataframe", "collection", "paged", "readonly"]) {
  test(`${kind} annotation editing`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => {
      // JupyterLab's debugger raises this while the notebook kernel has no debug session, unrelated to Metanno
      if (error.message === "No active debugger session" && error.stack?.includes("displayModules")) return;
      errors.push(error.stack);
    });
    await openNotebook(
      page,
      "annotations.ipynb",
      [
        `from annotation_app import make_application
store, application = make_application(${JSON.stringify(kind)})
application`,
      ],
      { run: true }
    );
    await page.waitForFunction(() => window.factory && window.historyState);
    await page.evaluate(() => historyState.ready);
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    // Header filters name the kind of value they take, eg a number for the todo IDs
    await expect(page.locator(".metanno-table-filter").first()).toHaveAttribute("placeholder", "number");
    if (kind === "readonly") {
      await page.getByRole("gridcell", { name: "pending", exact: true }).first().click();
      await page.waitForFunction(() => factory.selected.todos.identities.length > 0);
      assert.equal(await page.locator('input:not([disabled])[value="pending"]').count(), 0);
      assert.equal(await page.getByRole("button", { name: /Delete .*selected/ }).count(), 0);
      await page.evaluate(async () =>
        factory.store.todos.applyEdit((await readRows("todos"))[0], "review", "Notebook edit")
      );
      await page.getByRole("gridcell", { name: "Notebook edit", exact: true }).waitFor();
      assert.deepEqual(errors, []);
      // The grid column menu hides and shows columns and sorts the DataFrame query
      const todos = page.locator(".metanno-table").first();
      const menu = todos.getByRole("columnheader").first().getByRole("button", { name: "Column menu" });
      await menu.click();
      await page.getByRole("menuitem", { name: "Choose columns…" }).click();
      await page.getByRole("menuitemcheckbox", { name: "review" }).click();
      await page.keyboard.press("Escape");
      assert.equal(await todos.getByRole("columnheader").filter({ hasText: /^review/ }).count(), 0);
      await menu.click();
      await page.getByRole("menuitem", { name: "Reset columns" }).click();
      await todos.getByRole("columnheader").filter({ hasText: /^review/ }).waitFor();
      await page.getByRole("gridcell", { name: "Notebook edit", exact: true }).waitFor();
      const ids = () => todos.locator('[role=gridcell][aria-colindex="1"]').allTextContents();
      const ascending = await ids();
      await menu.click();
      await page.getByRole("menuitemradio", { name: /Sort descending/ }).click();
      await page.waitForFunction(
        (first) => document.querySelector('.metanno-table [role=gridcell][aria-colindex="1"]')?.textContent !== first,
        ascending[0]
      );
      assert.deepEqual(await ids(), [...ascending].reverse());
      // The tags of a working set can follow the selected todo, without changing what is loaded
      const tags = page.locator(".metanno-table").nth(1);
      await page.getByRole("button", { name: "Todos", exact: true }).click();
      await todos.locator('[role=gridcell][aria-colindex="1"]').filter({ hasText: /^2$/ }).click();
      await expect(tags.getByRole("gridcell", { name: "First", exact: true })).toHaveCount(0);
      await tags.getByRole("gridcell", { name: "Second", exact: true }).waitFor();
      // Clicking a tag selects its todo but keeps the tags shown
      await tags.getByRole("gridcell", { name: "Second", exact: true }).click();
      await tags.getByRole("gridcell", { name: "Second", exact: true }).waitFor();
      await page.getByRole("button", { name: "All", exact: true }).click();
      await tags.getByRole("gridcell", { name: "First", exact: true }).waitFor();
      // Clicking a header filter keeps the selected todo and its highlight, like a click outside the table
      const highlighted = () => todos.locator("[role=row][aria-selected=true]").count();
      const before = await highlighted();
      assert.ok(before > 0);
      await todos.locator(".metanno-table-filter").first().click();
      assert.equal(await page.evaluate(() => factory.selected.todos.identities.length), 1);
      assert.equal(await highlighted(), before);
      // A full copy is searched by header filters, there is no source to query
      assert.equal(await page.getByRole("button", { name: "Query source", exact: true }).count(), 0);
      // The app's dock layout listens to every native drag, header drags must still reorder columns
      await page.getByText("Dock content", { exact: true }).waitFor({ state: "attached" });
      await todos
        .getByRole("columnheader")
        .nth(2)
        .locator(".metanno-table-header-name")
        .dragTo(todos.getByRole("columnheader").first().locator(".metanno-table-header-name"));
      await expect(todos.getByRole("columnheader").first()).toHaveText(/^text/);
      return;
    }
    if (kind === "dataframe" || kind === "collection") {
      await page.getByRole("gridcell", { name: "pending", exact: true }).first().dblclick();
      await page.getByPlaceholder("Type here").press("Enter");
      await page.waitForFunction(() => !historyState.getSnapshot().pending);
      await page.getByRole("gridcell", { name: "pending", exact: true }).first().waitFor();
      assert.equal(await page.evaluate(() => historyState.canUndo), false);
      await page.getByRole("gridcell", { name: "pending", exact: true }).first().dblclick();
      const editor = page.getByPlaceholder("Type here");
      await editor.fill("");
      const input = await editor.elementHandle();
      for (const key of "Edited") {
        await editor.press(key);
        assert.ok(await input.evaluate((node) => node.isConnected && document.activeElement === node));
      }
      assert.equal(await editor.inputValue(), "Edited");
      await editor.press("Enter");
      await page.waitForFunction(() => !historyState.getSnapshot().pending);
      await page.getByRole("gridcell", { name: "Edited", exact: true }).waitFor();
      await undo(page);
      await page.getByRole("gridcell", { name: "pending", exact: true }).first().waitFor();
    }
    // Filter headers keep their input mounted while selection and the shared view change
    const filter = page.locator(".metanno-table-filter").first();
    await filter.waitFor();
    const input = await filter.elementHandle();
    await filter.click();
    assert.ok(await input.evaluate((node) => node.isConnected && document.activeElement === node));
    await page.keyboard.type("1");
    await page.waitForTimeout(150);
    assert.ok(await input.evaluate((node) => node.isConnected && document.activeElement === node));
    await page.keyboard.type("2");
    assert.equal(await filter.inputValue(), "12");
    if (kind === "paged") {
      await filter.fill("= 12");
      await page.getByRole("button", { name: "Apply source filters", exact: true }).waitFor();
    }
    await filter.fill("");
    if (kind !== "paged") {
      const cell = page.getByRole("gridcell", { name: "pending", exact: true }).first();
      await cell.click();
      // Firefox gives a synthetic copy event its own DataTransfer, read the copied text from the event
      const copied = await cell.evaluate((node) => {
        const event = new ClipboardEvent("copy", { bubbles: true, clipboardData: new DataTransfer() });
        node.dispatchEvent(event);
        return event.clipboardData.getData("text/plain");
      });
      assert.equal(copied, "pending");
    } else assert.equal(await page.getByRole("button", { name: "Apply source filters", exact: true }).count(), 0);
    if (kind === "dataframe") {
      const active = page.getByRole("columnheader").filter({ hasText: "active" }).locator("input");
      await active.fill("= t");
      await expect(page.getByRole("grid").first()).toHaveAttribute("aria-rowcount", "2");
      await active.fill("= wrong");
      await page.locator(".pret-view").getByRole("alert").filter({ hasText: "Boolean filters require" }).waitFor();
      assert.ok(await active.isVisible());
      assert.ok(await active.evaluate((node) => document.activeElement === node));
      // A click shows the whole error over several lines, and errors above a widget can be dismissed while their
      // cause remains
      const alert = page.locator(".pret-view").getByRole("alert").filter({ hasText: "Boolean filters require" });
      await alert.click();
      await expect(alert).toHaveCSS("white-space", "normal");
      await page.locator(".pret-view").getByRole("button", { name: "Dismiss error" }).click();
      assert.equal(await page.locator(".pret-view").getByRole("alert").count(), 0);
      await active.fill("= false");
      await page.waitForTimeout(150);
      assert.equal(await page.locator(".pret-view").getByRole("alert").count(), 0);
      await active.fill("");
      await expect(page.getByRole("grid").first()).toHaveAttribute("aria-rowcount", "3");
    }
    if (kind === "paged") {
      // Browsers stop scrolling past a maximum height, the grid shows the rows of a large source that fit below it
      await page.getByText("First 600000 of 2106296 rows, filter or sort to see the others").waitFor();
      await page.getByRole("gridcell", { name: "Todo 0", exact: true }).click();
      const grid = page.getByRole("grid").first();
      const rowHeight = await grid
        .getByRole("row")
        .nth(1)
        .evaluate((row) => row.getBoundingClientRect().height);
      for (const row of [495, 505, 1020, 995, 495]) {
        await grid.evaluate((element, top) => {
          element.scrollTop = top;
        }, row * rowHeight);
        await page.getByRole("gridcell", { name: `Todo ${row + 2}`, exact: true }).waitFor();
        await page.waitForTimeout(200);
        // The related tag query finishes after source rows can already be visible
        await page.waitForFunction(() => !factory.store.todos.loading && !factory.store.tags.loading);
        const count = await page.evaluate(() => calls.length);
        await page.waitForTimeout(300);
        assert.equal(await page.evaluate(() => calls.length), count);
        assert.ok(Math.abs((await grid.evaluate((element) => element.scrollTop)) - row * rowHeight) < 2);
      }
      assert.deepEqual(errors, []);
      return;
    }
    await page.getByText("First", { exact: true }).first().click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("First todo"));
    await page.getByRole("gridcell", { name: "Second", exact: true }).click();
    await page.waitForFunction(() => {
      const text = document.querySelector(".metanno-text-view");
      const span = text?.querySelector(".mention_token.selected");
      if (!span || text.scrollTop === 0) return false;
      const target = span.getBoundingClientRect(),
        viewport = text.getBoundingClientRect();
      return target.top >= viewport.top && target.bottom <= viewport.bottom;
    });
    await page.locator(".metanno-text-view").evaluate((text) => {
      text.scrollTop = 0;
    });
    await page.getByRole("gridcell", { name: "b", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view").scrollTop > 0);
    await page.getByRole("gridcell", { name: "First", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("First todo"));
    const review = page.getByLabel("review", { exact: true });
    const revision = await page.evaluate(() => historyState.getSnapshot().revision);
    await review.press("Control+a");
    await review.pressSequentially("draft");
    await review.press("Control+z");
    assert.equal(await page.evaluate(() => historyState.getSnapshot().revision), revision);
    await review.fill("draft");
    await page.evaluate(async (kind) => {
      if (kind === "dataframe") await factory.store.todos.applyEdit((await readRows("todos"))[0], "review", "peer");
      else factory.store.todos[0].review = "peer";
    }, kind);
    await page.waitForFunction(() =>
      [...document.querySelectorAll("[role=gridcell]")].some((cell) => cell.textContent === "peer")
    );
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    assert.equal(await review.inputValue(), "draft");
    await review.press("Escape");
    assert.equal(await review.inputValue(), "peer");
    await review.fill("saved");
    await review.press("Enter");
    await page.waitForFunction(() => !historyState.getSnapshot().pending && historyState.canUndo);
    await page.locator(".metanno-text-view").focus();
    await page.keyboard.press("Control+z");
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    await page.waitForFunction(() => [...document.querySelectorAll("input, textarea")].some((input) => input.value === "peer"));
    await page.waitForFunction(() => !historyState.getSnapshot().pending && historyState.canRedo);
    await page.keyboard.press("Control+Shift+z");
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    await page.waitForFunction(() => [...document.querySelectorAll("input, textarea")].some((input) => input.value === "saved"));
    await review.fill("uncommitted");
    await page.evaluate(() => (factory.selected.todos.identities = [2]));
    await page.waitForFunction(() =>
      [...document.querySelectorAll("input, textarea")].some((input) => input.value === "pending")
    );
    assert.equal(await review.inputValue(), "pending");
    assert.equal(await page.evaluate(async () => (await readRows("todos"))[0].review), "saved");
    await page.evaluate(() => (factory.selected.todos.identities = [1]));
    await page.waitForFunction(() => [...document.querySelectorAll("input, textarea")].some((input) => input.value === "saved"));
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("Second todo"));
    assert.ok(!(await page.locator(".metanno-text-view").getByText("First", { exact: true }).count()));
    await page.getByRole("button", { name: "← Previous", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("First todo"));
    // Without a mounted table, as when it sits in a hidden tab, the form moves through its own rows
    await page.evaluate(() => (window.todosHandles = factory.handles.todos.splice(0)));
    await page.getByRole("button", { name: "Next →", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("Second todo"));
    await page.evaluate(() => factory.handles.todos.push(...todosHandles));
    await page.getByRole("button", { name: "← Previous", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".metanno-text-view")?.textContent.includes("First todo"));
    // Hovering a tag row marks its span in the text with the hovered class, without rendering the text again
    await page.getByRole("gridcell", { name: "a", exact: true }).hover();
    await expect(page.locator(".metanno-text-view .mention_token.hovered")).not.toHaveCount(0);
    // Backspace with only text selected deletes no span and reports no error
    await page.locator(".metanno-text-view").first().focus();
    await selectText(page, "todo");
    await page.keyboard.press("Backspace");
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    assert.equal(await page.evaluate(async () => (await readRows("tags")).length), 2);
    assert.equal(await page.locator(".pret-view [role=alert]").count(), 0);
    await page.getByText("First", { exact: true }).first().click();
    await page.getByRole("button", { name: "Move", exact: true }).click();
    await selectText(page, "todo");
    await page.waitForFunction(async () => Number((await readRows("tags"))[0].begin) === 6);
    await undo(page);
    await page.waitForFunction(async () => Number((await readRows("tags"))[0].begin) === 0);
    await selectText(page, "todo");
    await page.getByRole("button", { name: "urgent", exact: true }).click();
    await page.waitForFunction(async () => (await readRows("tags")).length === 3);
    const added = await page.evaluate(async () =>
      (await readRows("tags")).find((row) => row.id !== "a" && row.id !== "b")
    );
    assert.match(String(added.id), /^[0-9a-f]{32}$/);
    assert.equal(Number(added.todo_id), 1);
    assert.equal(Number(added.begin), 6);
    assert.equal(Number(added.end), 10);
    await undo(page);
    await page.waitForFunction(async () => (await readRows("tags")).length === 2);
    // A click that leaves no focused element, as Safari and Firefox on macOS do for buttons, sends shortcuts to the
    // page body, they undo in the widget clicked last
    await page.getByText("First", { exact: true }).first().click();
    await page.getByRole("button", { name: /^Delete( 1 selected)? ⌫$/ }).click();
    await page.waitForFunction(() => !historyState.getSnapshot().pending && historyState.canUndo);
    assert.equal(await page.evaluate(async () => (await readRows("tags")).length), 1);
    await page.evaluate(() => document.activeElement.blur());
    await page.keyboard.press("Control+z");
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    await expect.poll(() => page.evaluate(async () => (await readRows("tags")).length)).toBe(2);
    await page.getByText("First", { exact: true }).first().click();
    if (kind === "dataframe") {
      const begin = page.getByLabel("begin", { exact: true });
      await begin.fill("bad integer");
      await begin.press("Enter");
      await page.waitForFunction(() => !historyState.getSnapshot().pending);
      await page.locator(".pret-view").getByRole("alert").first().waitFor();
      // The field keeps its own message for correction, the Store error appears once in the status bar
      await expect(page.locator(".metanno-status-bar [role=alert]")).toHaveCount(1);
      await expect(page.locator(".pret-view [role=alert]")).toHaveCount(2);
      assert.equal(await begin.inputValue(), "bad integer");
      await begin.press("Escape");
    }
    await page.evaluate(() => (factory.selected.tags.identities = ["a", "b"]));
    const mixed = page.getByRole("textbox", { name: "label (Multiple values)", exact: true });
    await mixed.fill("both");
    await mixed.press("Enter");
    await page.waitForFunction(() => !historyState.getSnapshot().pending);
    await page.waitForFunction(async () => (await readRows("tags")).every((row) => row.label === "both"));
    await undo(page);
    await page.waitForFunction(async () => (await readRows("tags"))[0].label === "First");
    await page.getByRole("button", { name: "Delete 2 selected", exact: true }).click();
    await page.waitForFunction(
      () => factory.selected.tags.identities.length === 0 && !historyState.getSnapshot().pending
    );
    assert.equal(await page.evaluate(async () => (await readRows("tags")).length), 0);
    await undo(page);
    assert.equal(await page.evaluate(async () => (await readRows("tags")).length), 2);
    if (kind === "dataframe") {
      // A changed foreign key moves the linked document before undo restores the original parent
      await page.getByRole("gridcell", { name: "First", exact: true }).click();
      await page.waitForFunction(
        () =>
          factory.selected.tags.row?.id === "a" &&
          factory.selected.todos.identities[0] === 1 &&
          !historyState.getSnapshot().pending
      );
      await expect(page.locator(".metanno-text-view")).toContainText("First todo");
      await page.evaluate(async () => {
        const row = (await readRows("tags")).find((row) => row.id === "a");
        await factory.store.tags.applyEdit(row, "todo_id", 2);
      });
      await page.waitForFunction(() => !historyState.getSnapshot().pending);
      assert.equal(
        await page.evaluate(async () => Number((await readRows("tags")).find((row) => row.id === "a").todo_id)),
        2
      );
      await expect
        .poll(async () => (await page.locator(".metanno-text-view .text-chunk-content").allTextContents()).join(""))
        .toContain("Second todo");
      await undo(page);
      await expect(page.locator(".metanno-text-view")).toContainText("First todo");
    }
    await page.evaluate(() => window.showAllDocuments());
    await page.waitForFunction(() => document.querySelectorAll("#all-documents .metanno-text-view").length === 2);
    const docs = await page.locator("#all-documents .metanno-text-view").allTextContents();
    assert.ok(docs[0].includes("First todo") && !docs[0].includes("Second todo"));
    assert.ok(docs[1].includes("Second todo") && !docs[1].includes("First todo"));
    assert.deepEqual(errors, []);
    const persisted = await addCodeCell(
      page,
      ".jp-NotebookPanel:not(.lm-mod-hidden)",
      `from pret import save_store, load_store_snapshot
def records(frame):
    return frame.materialize().to_pylist() if hasattr(frame, "materialize") else list(frame)
assert records(store["todos"])[0]["review"] == "saved"
save_store(store, "edited.pret")
reopened = load_store_snapshot("edited.pret")
assert records(reopened["todos"])[0]["review"] == "saved"
assert len(records(reopened["tags"])) == 2
if ${JSON.stringify(kind)} == "dataframe":
    store["todos"].update(identity={"id": 1}, values={"review": "Python edit"})
else:
    store["todos"][0]["review"] = "Python edit"
print("Saved annotation edits restored")`
    );
    await page.notebook.runCell(persisted, true);
    await expect(
      page.locator(".jp-OutputArea-output").getByText("Saved annotation edits restored", { exact: true })
    ).toBeVisible();
    await page.getByRole("gridcell", { name: "Python edit", exact: true }).waitFor();
  });
}

test("DataFrame text widget shows the documents of the selected parent and reports text selections", async ({
  page,
}) => {
  await openNotebook(page, "grouped.ipynb", ["from annotation_app import make_grouped_text\nmake_grouped_text()"], {
    run: true,
  });
  const texts = page.locator(".metanno-text-view");
  await expect(texts).toContainText(["First group todo"]);
  await expect(texts).toHaveCount(1);
  // The groups table opens on its first group, which the text and PDF widgets below it need, then the tables they
  // show select their first row, again for each selected group
  await page.waitForFunction(() => String(factory.selected.groups.identities) === "1");
  await page.waitForFunction(() => String(factory.selected.todos.identities) === "1");
  await page.waitForFunction(() => String(factory.selected.scans.identities) === "1");
  // While the scans of the new group load, the PDF of the previous scan stays under a loading pill
  await page.evaluate(() => {
    window.shown = new Set();
    new MutationObserver(() => {
      if (document.body.innerText.includes("No document selected")) window.shown.add("No document selected");
      for (const pill of document.querySelectorAll(".metanno-status-stack [role=status]")) window.shown.add(pill.innerText);
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  await page.locator(".metanno-table").first().getByRole("gridcell", { name: "2", exact: true }).click();
  await expect(texts).toContainText(["Second group todo", "Other todo"]);
  await expect(texts).toHaveCount(2);
  await page.waitForFunction(() => String(factory.selected.todos.identities) === "2");
  await page.waitForFunction(() => String(factory.selected.scans.identities) === "2");
  const shown = await page.evaluate(() => [...window.shown]);
  assert.ok(shown.includes("Loading data") && !shown.includes("No document selected"), String(shown));
  assert.equal(await page.evaluate(() => String(factory.selected.groups.identities)), "2");
  await page.evaluate(() => {
    const view = [...document.querySelectorAll(".metanno-text-view")].find((node) => node.textContent.includes("Other todo"));
    const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();
    while (!text.textContent.startsWith("Other")) text = walker.nextNode();
    const range = document.createRange();
    range.setStart(text, 0);
    range.setEnd(text, 5);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    view.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  });
  await page.waitForFunction(() => factory.selection.current?.text === "Other");
  // Joy components follow the JupyterLab theme through the data-theme attribute of the page
  for (const [theme, scheme] of [["JupyterLab Dark", "dark"], ["JupyterLab Light", "light"]]) {
    await page.evaluate(async (theme) => {
      await window.jupyterapp.commands.execute("apputils:change-theme", { theme });
    }, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
  }
  assert.deepEqual(await page.evaluate(() => [factory.selection.current.doc_id, factory.selection.current.ranges]), [
    "3",
    [{ begin: 0, end: 5 }],
  ]);
});

// Konva shapes render and edit the Store, a Konva renderer built for development froze pages using production React
test("AnnotatedImage draws shapes and edits their style", async ({ page }) => {
  await openNotebook(page, "image.ipynb", ["from image_app import MyImage\nMyImage()"], { run: true });
  const canvas = page.locator(".pret-view canvas").first();
  await canvas.waitFor();
  await page.waitForFunction(() => window.konvaStyles?.[0] === "primary");
  const box = await canvas.boundingBox();
  await page.mouse.click(box.x + 100, box.y + 18);
  await page.waitForFunction(() => window.konvaStyles?.[0] === "secondary");
});

for (const kind of ["dataframe", "collection"]) {
  test(`${kind} label lists edit from the table and the form`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.stack));
    await openNotebook(
      page,
      "labels.ipynb",
      [`from annotation_app import make_label_editing\nmake_label_editing(${JSON.stringify(kind)})`],
      { run: true }
    );
    await page.waitForFunction(() => window.factory);
    const labels = async (id) => (await page.evaluate(() => readRows("todos"))).find((row) => row.id === id).labels;
    const table = page.locator(".metanno-table");
    await table.getByRole("gridcell", { name: "1", exact: true }).click();
    await page.waitForFunction(() => String(factory.selected.todos.identities) === "1");

    // Each form field shows and edits the same list
    const field = (name) => page.locator(".MuiFormControl-root").filter({ has: page.getByText(name, { exact: true }) });
    await page.getByRole("checkbox", { name: "later", exact: true }).click();
    await expect.poll(() => labels(1)).toEqual(["urgent", "later"]);
    await field("Select").getByRole("combobox").click();
    await page.getByRole("option", { name: "home" }).click();
    await page.keyboard.press("Escape");
    await expect.poll(() => labels(1)).toEqual(["urgent", "later", "home"]);
    await field("Autocomplete").locator(".MuiChip-root", { hasText: "urgent" }).locator("button").click();
    await expect.poll(() => labels(1)).toEqual(["later", "home"]);
    await field("Tags").locator("input").fill("custom");
    await field("Tags").locator("input").press("Enter");
    await expect.poll(() => labels(1)).toEqual(["later", "home", "custom"]);
    await expect(table.getByRole("row").nth(1)).toContainText("custom");

    // The table cell edits the list as tags
    await table.getByRole("row").nth(2).getByRole("gridcell").nth(1).dblclick();
    await page.keyboard.type("home");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await expect.poll(() => labels(2)).toEqual(["home"]);

    // A text filter on the labels keeps the rows where one of the labels matches
    const filter = table.locator(".metanno-table-filter").nth(1);
    await filter.fill("cus");
    await expect(table.getByRole("gridcell", { name: "2", exact: true })).toHaveCount(0);
    await expect(table.getByRole("gridcell", { name: "1", exact: true })).toHaveCount(1);
    await filter.fill("");
    await table.getByRole("gridcell", { name: "2", exact: true }).click();

    // Rows holding other lists show a mixed value, and one choice gives both rows the same list
    await table.getByRole("gridcell", { name: "1", exact: true }).click({ modifiers: ["Shift"] });
    await page.waitForFunction(() => factory.selected.todos.identities.length === 2);
    await expect(page.getByText("Checkboxes (Multiple values)")).toBeVisible();
    await page.getByRole("checkbox", { name: "later", exact: true }).click();
    await expect.poll(async () => [await labels(1), await labels(2)]).toEqual([["later"], ["later"]]);
    await expect(page.getByText("Checkboxes", { exact: true })).toBeVisible();
    assert.deepEqual(errors, []);
  });
}

// Two panels share one view Store: wheel, keys, right drag and clicks write the shared view or add point rows
test("AnnotatedVolume panels render a served volume and share their view", async ({ page }) => {
  await openNotebook(page, "volume.ipynb", ["from volume_app import Viewer\nViewer()"], { run: true });
  const image = page.locator(".pret-view div[tabindex] > canvas").first();
  await image.waitFor();
  // The organ fills the middle of the axial panel, brighter than the background with the default window
  const centerGray = () =>
    page.evaluate(() => {
      const canvas = document.querySelector(".pret-view div[tabindex] > canvas") as HTMLCanvasElement;
      return canvas.getContext("2d").getImageData(canvas.width / 2 + 20, canvas.height / 2 + 20, 1, 1).data[0];
    });
  await expect.poll(centerGray).toBeGreaterThan(150);

  const box = await image.boundingBox();
  await page.mouse.move(box.x + 150, box.y + 150);
  await page.mouse.wheel(0, -100);
  await page.waitForFunction(() => window.volumeView?.cursor !== undefined);
  const first = await page.evaluate(() => window.volumeView.cursor);
  await page.mouse.wheel(0, -100);
  // One wheel step moves the cursor by one 3 mm slice along the tilted slice normal
  await page.waitForFunction((z) => window.volumeView.cursor[2] > z + 2.5, first[2]);

  // A click focuses the panel for keys, and moves the cursor within the shown plane
  await page.mouse.click(box.x + 150, box.y + 150);
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => window.volumeView.frames?.phantom === 1);

  // The 20 slices stop the wheel at the last one
  for (let idx = 0; idx < 25; idx++) await page.mouse.wheel(0, -100);
  await page.waitForTimeout(500);
  const top = await page.evaluate(() => window.volumeView.cursor[2]);
  await page.mouse.wheel(0, -100);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.volumeView.cursor[2])).toBeCloseTo(top, 6);

  // The view cannot zoom out of the fitted volume, and a drag pans only once zoomed in: at zoom 1 two opposite drags
  // both give the middle of the volume as center
  const drag = async (dx: number, dy: number) => {
    await page.mouse.move(box.x + 150, box.y + 150);
    await page.mouse.down();
    await page.mouse.move(box.x + 150 + dx, box.y + 150 + dy, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    return page.evaluate(() => [...window.volumeView.center]);
  };
  const zoomBy = async (deltaY: number) => {
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, deltaY);
    await page.keyboard.up("Control");
    await page.waitForTimeout(300);
  };
  await zoomBy(300);
  expect(await page.evaluate(() => window.volumeView.zoom ?? null)).toBeNull();
  const fitted = await drag(60, 40);
  const back = await drag(-60, -40);
  back.forEach((value, axis) => expect(value).toBeCloseTo(fitted[axis], 3));
  await zoomBy(-300);
  expect(await page.evaluate(() => window.volumeView.zoom)).toBeGreaterThan(1.5);
  const panned = await drag(30, 20);
  expect(Math.hypot(...panned.map((value, axis) => value - fitted[axis]))).toBeGreaterThan(1);
  // Zooming out stops at the fitted volume, which the panel shows whole again
  await zoomBy(2000);
  expect(await page.evaluate(() => window.volumeView.zoom)).toBe(1);

  // Option (Alt) with a left drag sets the window like a right drag, for trackpads
  await page.keyboard.down("Alt");
  await page.mouse.move(box.x + 150, box.y + 150);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 170);
  await page.mouse.up();
  await page.keyboard.up("Alt");
  await page.waitForFunction(() => window.volumeView.windows?.phantom?.length === 2);

  await page.getByRole("button", { name: "Edit" }).click();
  await page.mouse.click(box.x + 120, box.y + 140);
  await page.waitForFunction(() => window.volumePoints?.length === 1);
  // The point lies on the plane shown by the axial panel, through the cursor
  const [cursor, point] = await page.evaluate(() => [window.volumeView.cursor, window.volumePoints[0].points[0]]);
  const normal = [0, -Math.sin((8 * Math.PI) / 180), Math.cos((8 * Math.PI) / 180)];
  const depth = normal.reduce((sum, n, idx) => sum + n * (point[idx] - cursor[idx]), 0);
  expect(Math.abs(depth)).toBeLessThan(1e-6);
});

// Polygons from clicks and lassos from drags become rows with their slab thickness, a handle moves one point
test("AnnotatedVolume draws polygons and lassos and moves polygon points", async ({ page }) => {
  await openNotebook(page, "volume-draw.ipynb", ["from volume_app import Viewer\nViewer()"], { run: true });
  const image = page.locator(".pret-view div[tabindex] > canvas").first();
  await image.waitFor();
  const box = await image.boundingBox();
  const at = (x: number, y: number) => [box.x + x, box.y + y] as [number, number];

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Polygon" }).click();
  for (const [x, y] of [[100, 100], [200, 100], [150, 180]]) await page.mouse.click(...at(x, y));
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.volumePoints?.length === 1);
  const polygon = await page.evaluate(() => window.volumePoints[0]);
  expect([polygon.kind, polygon.points.length]).toEqual(["polygon", 3]);
  // 3 mm slices of the phantom
  expect(polygon.thickness).toBeCloseTo(3, 6);

  // A circle traced every few pixels keeps only the points that bend it
  await page.getByRole("button", { name: "Lasso" }).click();
  await page.mouse.move(...at(230, 150));
  await page.mouse.down();
  for (let step = 1; step <= 60; step++) {
    const angle = (step / 60) * 2 * Math.PI;
    await page.mouse.move(...at(200 + 30 * Math.cos(angle), 150 + 30 * Math.sin(angle)));
  }
  await page.mouse.up();
  await page.waitForFunction(() => window.volumePoints.length === 2);
  const lasso = await page.evaluate(() => window.volumePoints[1].points.length);
  expect(lasso).toBeGreaterThan(8);
  expect(lasso).toBeLessThan(60);

  // In move mode, clicking the polygon selects it and its handles move one point at a time
  await page.getByRole("button", { name: "Move", exact: true }).click();
  await page.mouse.click(...at(150, 120));
  await page.mouse.move(...at(200, 100));
  await page.mouse.down();
  await page.mouse.move(...at(230, 60), { steps: 5 });
  await page.mouse.up();
  await page.waitForFunction((before) => JSON.stringify(window.volumePoints[0].points) !== before, JSON.stringify(polygon.points));
  const after = await page.evaluate(() => window.volumePoints[0].points);
  expect(after[0]).toEqual(polygon.points[0]);
  expect(after[2]).toEqual(polygon.points[2]);
  expect(after[1]).not.toEqual(polygon.points[1]);

  // The sagittal panel shows the axial polygon as a band, a click on it brings the cursor back onto the polygon plane
  // and selects it
  const normal = [0, -Math.sin((8 * Math.PI) / 180), Math.cos((8 * Math.PI) / 180)];
  const depth = (p: number[]) => normal.reduce((sum, n, idx) => sum + n * (p[idx] - after[0][idx]), 0);
  await page.mouse.click(...at(140, 270));
  await page.waitForFunction(() => window.volumeSelected.length === 0);
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await expect.poll(async () => depth(await page.evaluate(() => window.volumeView.cursor))).toBeGreaterThan(5.5);
  const band = await page.evaluate(() => {
    const stage = window.Konva.stages.find((stage) => stage.findOne(".band"));
    const rect = stage.findOne(".band").getClientRect();
    const box = stage.container().getBoundingClientRect();
    return [box.x + rect.x + rect.width / 2, box.y + rect.y + rect.height / 2] as [number, number];
  });
  await page.mouse.click(...band);
  await page.waitForFunction(() => window.volumeSelected.length === 1);
  expect(await page.evaluate(() => window.volumeSelected[0])).toEqual(polygon.id);
  await expect.poll(async () => Math.abs(depth(await page.evaluate(() => window.volumeView.cursor)))).toBeLessThan(1e-3);
});

test("Volume widget without shapes only shows the series of the selected study", async ({ page }) => {
  await openNotebook(page, "volume-browse.ipynb", ["from volume_widget_app import Browser\nBrowser()"], { run: true });
  await page.getByRole("gridcell", { name: "s1", exact: true }).click();
  const panels = page.locator(".pret-view div[tabindex] > canvas");
  await expect(panels).toHaveCount(3);
  await expect(page.getByRole("button", { name: "edit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New object", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "sequence", exact: true }).click();
  await expect(panels).toHaveCount(2);
});

test("Volume widget draws the overlays of a volume and hides them from the toolbar", async ({ page }) => {
  const code = "from volume_widget_app import Overlays\nOverlays()";
  await openNotebook(page, "volume-overlays.ipynb", [code], { run: true });
  // The DataFrame studies table selects its only study without a click
  await expect(page.locator(".pret-view div[tabindex] > canvas")).toHaveCount(3);
  // Red minus blue on the axial panel, a tenth of its width left or right of the centre
  const tint = (side: number) =>
    page.evaluate((side) => {
      const canvas = document.querySelector(".pret-view div[tabindex] > canvas") as HTMLCanvasElement;
      const x = canvas.width / 2 + (side * canvas.width) / 10;
      const [red, , blue] = canvas.getContext("2d").getImageData(x, canvas.height / 2, 1, 1).data;
      return red - blue;
    }, side);
  await expect.poll(() => tint(-1)).toBeGreaterThan(50);
  await expect.poll(() => tint(1)).toBeLessThan(-50);
  await page.getByRole("button", { name: "Reader", exact: true }).click();
  await expect.poll(() => tint(-1)).toBe(0);
  await expect.poll(() => tint(1)).toBeLessThan(-50);
  await page.getByRole("button", { name: "Reader", exact: true }).click();
  await expect.poll(() => tint(-1)).toBeGreaterThan(50);
});

test("Volume widget draws a box over several slices and gives a named window to the volumes that have it", async ({
  page,
}) => {
  await openNotebook(page, "volume-box.ipynb", ["from volume_widget_app import Viewer\nViewer()"], { run: true });
  await page.getByRole("gridcell", { name: "s1", exact: true }).click();
  const panels = page.locator(".pret-view div[tabindex] > canvas");
  await expect(panels).toHaveCount(3);
  // Pointer positions from the centre of the main panel, the plane of the slices of the T2
  const around = async (dx: number, dy: number) => {
    await panels.first().scrollIntoViewIfNeeded();
    const box = await panels.first().boundingBox();
    return [box.x + box.width / 2 + dx, box.y + box.height / 2 + dy] as [number, number];
  };
  const shapes = () => page.evaluate(() => window.volumeShapes.map((row) => ({ ...row })));
  const bands = (stageIdx: number) =>
    page.evaluate((stageIdx) => window.Konva.stages[stageIdx].find(".band").length, stageIdx);

  // A drag beside the cursor with two wheel steps of 3 mm slices gives a box over three slices, which the two other
  // planes draw while it grows since the cursor follows the middle of the box
  await page.getByRole("button", { name: "edit", exact: true }).click();
  await page.getByRole("button", { name: "box", exact: true }).click();
  expect([await bands(1), await bands(2)]).toEqual([0, 0]);
  await page.mouse.move(...(await around(20, 20)));
  await page.mouse.down();
  await page.mouse.move(...(await around(80, 60)), { steps: 5 });
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await expect.poll(async () => [await bands(1), await bands(2)]).toEqual([1, 1]);
  await page.mouse.up();
  await expect.poll(async () => (await shapes()).length).toBe(1);
  const [box] = await shapes();
  expect(box).toMatchObject({ study_uid: "s1", kind: "box", object: "L1", label: "L1" });
  expect(box.points).toHaveLength(4);
  expect(box.thickness).toBeCloseTo(9, 1);
  await expect.poll(async () => [await bands(1), await bands(2)]).toEqual([1, 1]);
  // The new box is selected, and "Delete shape" removes it
  await page.getByRole("button", { name: "Delete shape", exact: true }).click();
  await expect.poll(async () => (await shapes()).length).toBe(0);

  // "Dark" is a window of the T2 only, so picking it darkens the T2 panel and leaves the ADC panel as it was
  await page.getByRole("button", { name: "sequence", exact: true }).click();
  await expect(panels).toHaveCount(2);
  const centerGray = (idx: number) =>
    page.evaluate((idx) => {
      const canvas = document.querySelectorAll(".pret-view div[tabindex] > canvas")[idx] as HTMLCanvasElement;
      return canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[0];
    }, idx);
  await expect.poll(() => centerGray(0)).toBeGreaterThan(150);
  await expect.poll(() => centerGray(1)).toBeGreaterThan(150);
  const windowField = page.locator(".MuiFormControl-root").filter({ has: page.getByText("Window", { exact: true }) });
  await windowField.getByRole("combobox").click();
  await page.getByRole("option", { name: "Dark", exact: true }).click();
  await expect.poll(() => centerGray(0)).toBe(0);
  expect(await centerGray(1)).toBeGreaterThan(150);
});

test("Volume widget series of different spaces move and keep their shapes apart", async ({ page }) => {
  await openNotebook(page, "volume-spaces.ipynb", ["from volume_widget_app import Spaces\nSpaces()"], { run: true });
  await page.getByRole("gridcell", { name: "s3", exact: true }).click();
  // The right series in the @R cell of the dock, the two left ones as tabs of the @L cell
  const panels = page.locator(".pret-view div[tabindex] > canvas");
  await expect(panels).toHaveCount(2);
  const shapes = () => page.evaluate(() => window.spaceShapes.map((row) => ({ ...row })));
  const click = async (idx: number) => {
    const box = await panels.nth(idx).boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  const [right, left] = await Promise.all([0, 1].map((idx) => panels.nth(idx).boundingBox()));
  expect(Math.abs(right.y - left.y)).toBeLessThan(1);
  expect(left.x).toBeGreaterThan(right.x + right.width - 1);
  // The edges of the first left series come from its axis letters, the others from their affine
  const letters = () =>
    page.evaluate(() =>
      window.Konva.stages.map((stage) =>
        stage
          .find("Text")
          .map((text) => text.text())
          .filter((text) => /^[APLRSIHF]+$/.test(text))
          .sort()
      )
    );
  expect(await letters()).toEqual([
    ["A", "L", "P", "R"],
    ["A", "FR", "HL", "P"],
  ]);

  // A point on the right panel, then three slices further on the right panel only, then a point on the left panel
  await page.getByRole("button", { name: "edit", exact: true }).click();
  await click(0);
  await expect.poll(async () => (await shapes()).length).toBe(1);
  for (let idx = 0; idx < 3; idx++) await page.mouse.wheel(0, -100);
  await click(1);
  await expect.poll(async () => (await shapes()).length).toBe(2);
  const [rightPoint, leftPoint] = await shapes();
  expect(rightPoint).toMatchObject({ kind: "point", space: "r" });
  expect(leftPoint).toMatchObject({ kind: "point", space: "l" });
  // The left panel kept its own slice, where it draws its point but not the right point lying on that slice
  expect(leftPoint.points[0][2]).toBeCloseTo(rightPoint.points[0][2], 3);
  const circles = () => page.evaluate(() => window.Konva.stages.map((stage) => stage.find("Circle").length));
  expect(await circles()).toEqual([0, 1]);

  // Three slices further on the left series, then its projection tab, which still shows its slice, keeps the cursor
  // depth on the wheel and draws the left points of every depth
  for (let idx = 0; idx < 3; idx++) await page.mouse.wheel(0, -100);
  await page.locator(".tab-handle", { hasText: /^L2$/ }).click();
  await expect.poll(letters).toEqual([
    ["A", "L", "P", "R"],
    ["A", "L", "P", "R"],
  ]);
  const brightness = () =>
    page.evaluate(() => {
      const canvas = document.querySelectorAll(".pret-view div[tabindex] > canvas")[1] as HTMLCanvasElement;
      return canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2 + 20, 1, 1).data[0];
    });
  await expect.poll(brightness).toBeGreaterThan(40);
  const box = await panels.nth(1).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let idx = 0; idx < 3; idx++) await page.mouse.wheel(0, -100);
  await click(1);
  await expect.poll(async () => (await shapes()).length).toBe(3);
  const projectionPoint = (await shapes())[2];
  expect(projectionPoint).toMatchObject({ kind: "point", space: "l" });
  expect(projectionPoint.points[0][2]).not.toBeCloseTo(leftPoint.points[0][2], 1);
  await expect.poll(circles).toEqual([0, 2]);

  // The tabs arrangement stacks the series in one cell, the orthogonal layout gives each series a tab of three planes
  const tabs = () => page.locator(".tab-handle").allInnerTexts();
  await page.getByRole("button", { name: "tabs", exact: true }).click();
  await expect(panels).toHaveCount(1);
  await expect.poll(tabs).toEqual(expect.arrayContaining(["R", "L", "L2", "Toolbar"]));
  await page.getByRole("button", { name: "orthogonal", exact: true }).click();
  await expect(panels).toHaveCount(3);
  await expect.poll(tabs).toEqual(expect.arrayContaining(["R", "L", "L2", "Toolbar"]));
  await page.getByRole("button", { name: "sides", exact: true }).click();
  await expect(panels).toHaveCount(2);
});

// The same checks with the shapes in a Store list and in a DataFrame, as annotation copies of a recipe save them
for (const [kind, viewer] of [
  ["list", "Viewer"],
  ["DataFrame", "DataFrameViewer"],
]) {
  test(`Volume widget draws shapes of the selected study and follows the shapes table, ${kind} shapes`, async ({
    page,
  }) => {
    const code = `from volume_widget_app import ${viewer}\n${viewer}()`;
    await openNotebook(page, `volume-widget-${kind}.ipynb`, [code], { run: true });
    await page.getByRole("gridcell", { name: "s1", exact: true }).click();
    const panels = page.locator(".pret-view div[tabindex] > canvas");
    await expect(panels).toHaveCount(3);
    // Clicks in the notebook output may scroll it, eg on the toolbar below the panels, so the axial panel is scrolled
    // back into view and measured before each use
    const at = async (x: number, y: number) => {
      await panels.first().scrollIntoViewIfNeeded();
      const box = await panels.first().boundingBox();
      return [box.x + x, box.y + y] as [number, number];
    };
    const shapes = () => page.evaluate(() => window.volumeShapes.map((row) => ({ ...row })));
    const triangle = async () => {
      for (const [x, y] of [[100, 100], [200, 100], [150, 180]]) await page.mouse.click(...(await at(x, y)));
      await page.keyboard.press("Enter");
    };
    // Closed lines of a stage, the outlines and bands of the shapes, and the selected outlines drawn twice as thick
    const outlines = (stageIdx: number) =>
      page.evaluate((stageIdx) => {
        const lines = window.Konva.stages[stageIdx].find("Line").filter((line) => line.closed());
        return { all: lines.length, selected: lines.filter((line) => line.strokeWidth() === 4).length };
      }, stageIdx);

    // Two outlines of L1 three slices apart, filled in between, then an outline of L2
    await page.getByRole("button", { name: "edit", exact: true }).click();
    await page.getByRole("button", { name: "polygon", exact: true }).click();
    await triangle();
    await expect.poll(async () => (await shapes()).length).toBe(1);
    expect((await shapes())[0]).toMatchObject({ study_uid: "s1", kind: "polygon", object: "L1", label: "L1" });
    for (let idx = 0; idx < 3; idx++) await page.mouse.wheel(0, -100);
    await triangle();
    await expect.poll(async () => (await shapes()).length).toBe(2);
    await page.getByRole("button", { name: "Fill slices" }).click();
    await expect.poll(async () => (await shapes()).filter((row) => row.interpolated).length).toBe(2);
    const filled = (await shapes()).filter((row) => row.interpolated).map((row) => row.id);
    // Filling again replaces the filled outlines in one Store action, which one undo reverts
    await page.getByRole("button", { name: "Fill slices" }).click();
    await expect
      .poll(async () => (await shapes()).filter((row) => row.interpolated && !filled.includes(row.id)).length)
      .toBe(2);
    // Undo waits for the edit to be saved
    const saved = () => page.waitForFunction(() => !window.volumeHistory.pending && window.volumeHistory.canUndo);
    await saved();
    await page.keyboard.press("ControlOrMeta+z");
    await expect
      .poll(async () => (await shapes()).filter((row) => row.interpolated).map((row) => row.id).sort())
      .toEqual([...filled].sort());
    await page.getByRole("button", { name: "New object" }).click();
    await page.mouse.move(...(await at(150, 150)));
    await page.mouse.wheel(0, -100);
    await triangle();
    await expect.poll(async () => (await shapes()).length).toBe(5);
    expect((await shapes())[4]).toMatchObject({ study_uid: "s1", object: "L2" });

    // A row of the shapes table glides the panels onto its shape and selects it, Delete removes it
    await page.mouse.wheel(0, -100);
    await page.mouse.wheel(0, -100);
    await page.getByRole("gridcell", { name: "polygon" }).first().click();
    await expect.poll(async () => (await outlines(0)).selected).toBe(1);
    await panels.first().locator("..").focus();
    await page.keyboard.press("Delete");
    await expect.poll(async () => (await shapes()).length).toBe(4);

    // A point belongs to the current object, Ctrl+Z in the panel removes it
    await page.getByRole("button", { name: "point", exact: true }).click();
    await page.mouse.click(...(await at(60, 60)));
    await expect.poll(async () => (await shapes()).length).toBe(5);
    expect((await shapes())[4]).toMatchObject({ kind: "point", object: "L2", label: "L2" });
    await saved();
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(async () => (await shapes()).length).toBe(4);

    // The sequence layout shows one axial panel per series
    await page.getByRole("button", { name: "sequence", exact: true }).click();
    await expect(panels).toHaveCount(2);

    // Study s2 shows none of the shapes of s1
    await page.getByRole("gridcell", { name: "s2", exact: true }).click();
    await expect(panels).toHaveCount(1);
    await page.waitForTimeout(500);
    expect(await outlines(0)).toEqual({ all: 0, selected: 0 });
  });
}
