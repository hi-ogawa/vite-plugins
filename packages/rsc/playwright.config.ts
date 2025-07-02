import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  use: {
    trace: "on-first-retry",
  },
  timeout: 10000,
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
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
}) as any;
