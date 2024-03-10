import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const commandMap = {
  dev: `pnpm dev --port ${port} --strict-port`,
  preview: `pnpm preview --port ${port} --strict-port`,
};
const command = commandMap[process.env.E2E_COMMAND || "dev"]!;

export default defineConfig({
  testDir: "e2e",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  webServer: {
    command,
    port,
  },
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
});
