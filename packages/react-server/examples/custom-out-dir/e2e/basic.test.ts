import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("custom outDir app can be visited", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  expect(await page.textContent("h1")).toBe("Hello from custom out dir!");

  if (!process.env.E2E_CF) {
    await expect(page.getByTestId("import-meta-url")).toContainText(
      process.env.E2E_PREVIEW
        ? "examples/custom-out-dir/custom-out-dir/server"
        : "examples/custom-out-dir/app/page.tsx",
    );
  }
});

test("custom outDir is created @build", async () => {
  expect(fs.existsSync("custom-out-dir")).toBe(true);
  expect(fs.existsSync("dist")).toBe(false);
});
