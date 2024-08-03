import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("custom outDir app can be visited", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  expect(await page.textContent("h1")).toBe("Hello from custom out dir!");
});

test("custom outDir is created @build", async () => {
  expect(fs.existsSync("custom-out-dir")).toBe(true);
});

test("default outDir is not created @build", async () => {
  expect(fs.existsSync("dist")).toBe(false);
});
