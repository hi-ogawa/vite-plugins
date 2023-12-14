import { defineConfig, devices } from "@playwright/test";

const PORT = 6173;
const command = process.env.E2E_COMMAND ?? "pnpm dev";

export default defineConfig({
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  webServer: {
    command: `${command} --port ${PORT} --strict-port`,
    port: PORT,
  },
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env.CI ? 2 : 0,
});
