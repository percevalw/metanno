const fs = require("fs/promises");
const os = require("os");
const path = require("path");

function createDirectoryResetController(targetDir) {
  const fixtureDir = path.join(
    os.tmpdir(),
    `pret-galata-fixture-${path.basename(targetDir)}-${process.pid}-${Date.now()}`
  );

  return {
    async prepare() {
      await fs.rm(fixtureDir, { recursive: true, force: true });
      await fs.cp(targetDir, fixtureDir, { recursive: true, force: true });
    },

    async reset() {
      await fs.rm(targetDir, { recursive: true, force: true });
      await fs.mkdir(path.dirname(targetDir), { recursive: true });
      await fs.cp(fixtureDir, targetDir, { recursive: true, force: true });
    },

    async dispose() {
      await fs.rm(fixtureDir, { recursive: true, force: true });
    },
  };
}

async function setCellSource(page, activePanel, cellIndex, source) {
  await page.notebook.setCellType(cellIndex, "code");
  await page.notebook.selectCells(cellIndex);
  await page.notebook.enterCellEditingMode(cellIndex);
  const cell = page.locator(
    `${activePanel} .jp-Cell:nth-child(${cellIndex + 1})`
  );
  await cell.getByRole("textbox").fill(source);
  await page.notebook.leaveCellEditingMode(cellIndex);
}

async function addCodeCell(page, activePanel, source) {
  const cellIndex = await page.notebook.getCellCount();
  await page.notebook.addCell("code", "");
  await setCellSource(page, activePanel, cellIndex, source);
  return cellIndex;
}

module.exports = { createDirectoryResetController, setCellSource, addCodeCell };
