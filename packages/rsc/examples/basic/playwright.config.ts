import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const isPreview = Boolean(process.env.E2E_PREVIEW);
const command = isPreview
  ? `pnpm preview --port ${port}`
  : `pnpm dev --port ${port}`;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: process.env.TEST_BASE
      ? `http://localhost:${port}/custom-base/`
      : undefined,
    trace: "on-first-retry",
    launchOptions: {
      slowMo: process.env.E2E_SLOWMO ? 500 : 0,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: null,
        deviceScaleFactor: undefined,
      },
    },
  ],
  webServer: {
    command,
    port,
    stdout: process.env.E2E_STDOUT ? "pipe" : undefined,
  },
  grepInvert: isPreview ? /@dev/ : /@build/,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? "github" : "list",
});
