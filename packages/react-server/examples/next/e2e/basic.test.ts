import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await page.getByRole("img", { name: "Next.js logo" }).click();
});
