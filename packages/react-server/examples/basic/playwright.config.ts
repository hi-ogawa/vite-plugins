import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT || 6174);
const isPreview = Boolean(process.env.E2E_PREVIEW);
const command = isPreview
  ? process.env["E2E_CF"]
    ? `pnpm cf-preview --port ${port}`
    : `pnpm preview --port ${port} --strict-port`
  : `pnpm dev --port ${port} --strict-port`;

export default defineConfig({
  testDir: "e2e",
  use: {
    trace: "on-first-retry",
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
    env: { ...process.env, E2E: "true" },
  },
  grepInvert: isPreview ? /@dev/ : /@build/,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: "list",
});
