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

module.exports = { createDirectoryResetController };
