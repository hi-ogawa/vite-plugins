import { defineConfig } from "@playwright/test";

// cf. misc/test-example.sh

const port = Number(process.env["PORT"] ?? "4456");
const command = process.env["E2E_COMMAND"] ?? "pnpm dev";

export default defineConfig({
  testDir: "examples",
  use: {
    baseURL: `http://localhost:${port}`,
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
          args: ["--window-size=600,800"],
        },
      },
    },
  ],
  webServer: {
    command,
    port,
    reuseExistingServer: true,
  },
  forbidOnly: Boolean(process.env["CI"]),
});
