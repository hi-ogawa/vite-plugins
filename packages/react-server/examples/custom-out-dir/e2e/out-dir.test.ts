import fs from "fs";
import { expect, test } from "@playwright/test";
test("app renders", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  expect(await page.textContent("h1")).toBe("Hello from custom out dir!");
});

test("custom out directory should exist", () => {
  const outDir = "custom-out-dir";
  expect(fs.existsSync(outDir)).toBe(true);
});

test("default out directory should not exist", () => {
  expect(fs.existsSync("dist")).toBe(false);
});
