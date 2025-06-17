import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const isPreview = Boolean(process.env.E2E_PREVIEW);
const command = `pnpm ${isPreview ? "preview" : "dev"} --port ${port}`;

export default defineConfig({
  testDir: "e2e",
  use: {
    trace: "on-first-retry",
    launchOptions: {
      slowMo: process.env.E2E_DEBUG ? 500 : 0,
    },
  },
  expect: {
    toPass: { timeout: 5000 },
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
    stdout: process.env.E2E_DEBUG ? "pipe" : undefined,
  },
  grepInvert: isPreview ? /@dev/ : /@build/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
});
