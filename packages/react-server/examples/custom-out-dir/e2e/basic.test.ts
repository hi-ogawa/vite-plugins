import fs from "node:fs";
import { expect, test } from "@playwright/test";
test("custom outDir app can be visited", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  expect(await page.textContent("h1")).toBe("Hello from custom out dir!");
  if (process.env.VITE_E2E_OUT_DIR) {
    expect(await page.textContent("pre")).toBe(process.env.VITE_E2E_OUT_DIR);
  }
});

test("custom outDir is created", async () => {
  test.skip(
    !process.env.E2E_PREVIEW && !process.env.E2E_CF,
    "outDir is not available in preview",
  );
  const outDir = process.env.VITE_E2E_OUT_DIR || "custom-out-dir";
  expect(fs.existsSync(outDir)).toBe(true);
});

test("default outDir is not created", async () => {
  expect(fs.existsSync("dist")).toBe(false);
});
