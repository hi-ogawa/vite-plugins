import { defineConfig, devices } from "@playwright/test";

const PORT = 6173;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
      // use: {
      //   browserName: "chromium",
      //   // adapt viewport size to browser window size specified below. otherwise viewport will get cropped.
      //   // https://github.com/microsoft/playwright/issues/1086#issuecomment-592227413
      //   viewport: null,
      //   launchOptions: {
      //     args: ["--window-size=1200,800"],
      //   },
      // },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strict-port`,
    port: PORT,
    reuseExistingServer: true,
  },
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env.CI ? 2 : 0,
});
