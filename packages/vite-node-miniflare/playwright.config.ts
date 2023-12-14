import { defineConfig, devices } from "@playwright/test";

const PORT = 6173;
const DEMO_DIR = process.env.DEMO_DIR ?? "demo";

export default defineConfig({
  testDir: `${DEMO_DIR}/e2e`,
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
    command: `cd ${DEMO_DIR} && vite dev --port ${PORT} --strict-port`,
    port: PORT,
  },
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env.CI ? 2 : 0,
});
