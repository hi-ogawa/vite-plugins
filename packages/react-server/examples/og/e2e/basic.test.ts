import assert from "node:assert";
import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const res = await page.goto("/og?title=Hi");
  assert(res);
  expect(res.status()).toBe(200);
  expect(res?.headers()).toMatchObject({ "content-type": "image/png" });
  await expect(page).toHaveScreenshot();
});
