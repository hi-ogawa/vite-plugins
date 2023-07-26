import process from "node:process";
import { defineConfig } from "@playwright/test";

const port = Number(process.env["PORT"] ?? "4456");
const command = process.env["E2E_COMMAND"] ?? `pnpm dev:vite`;

export default defineConfig({
  testDir: "e2e",
  use: {
    baseURL: `http://localhost:${port}`,
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
    env: {
      ...(process.env as any),
      PORT: port,
    },
    reuseExistingServer: true,
  },
  forbidOnly: Boolean(process.env["CI"]),
});
