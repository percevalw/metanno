import { defineConfig, devices } from "@playwright/test";
import "@jupyterlab/galata/lib/playwright-config";

export default defineConfig<{
  python: string;
}>({
  use: {
    // jupyter url
    baseURL: "http://localhost:8889",
  },
  timeout: 60_000,
  reporter: [
    [
      "blob",
      { outputFile: `./blob-report/report-${process.env.PYTHON_VERSION}.zip` },
    ],
  ],
  projects: [
    {
      name: `chromium-${process.env.PYTHON_VERSION}`,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: `firefox-${process.env.PYTHON_VERSION}`,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: `webkit-${process.env.PYTHON_VERSION}`,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
