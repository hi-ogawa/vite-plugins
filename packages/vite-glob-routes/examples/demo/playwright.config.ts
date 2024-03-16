import process from "node:process";
import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const isPreview = Boolean(process.env.E2E_PREVIEW);
const command = isPreview
  ? `pnpm preview --port ${port} --strict-port`
  : `pnpm dev --port ${port} --strict-port`;

export default defineConfig({
  testDir: "e2e",
  retries: process.env.CI ? 1 : 0,
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // adapt viewport size to browser window size specified below. otherwise viewport will get clipped.
        // https://github.com/microsoft/playwright/issues/1086#issuecomment-592227413
        viewport: null,
        launchOptions: {
          args: ["--window-size=1200,800"],
        },
      },
    },
  ],
  webServer: {
    command: command + ` >> dev-e2e.log 2>&1`,
    port,
    reuseExistingServer: true,
  },
  forbidOnly: Boolean(process.env["CI"]),
});
