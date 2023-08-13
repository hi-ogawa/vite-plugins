import { defineConfig } from "@playwright/test";

// TODO: restructure examples tests

// run e2e test in examples
// E2E_COMMAND="pnpm -C examples/spa dev" npx playwright test --headed examples/spa/e2e/basic.test.ts

// see also examples/test.sh

const PORT = Number((process.env["PORT"] ??= "4456"));
const command = process.env["E2E_COMMAND"] ?? "pnpm dev";

export default defineConfig({
  testDir: "examples",
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        // adapt viewport size to browser window size specified below. otherwise viewport will get cropped.
        // https://github.com/microsoft/playwright/issues/1086#issuecomment-592227413
        viewport: null,
        launchOptions: {
          args: ["--window-size=1200,800"],
        },
      },
    },
  ],
  webServer: {
    command,
    port: PORT,
    reuseExistingServer: true,
  },
  forbidOnly: Boolean(process.env["CI"]),
});
