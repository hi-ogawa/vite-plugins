import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await page.getByRole("img", { name: "Next.js logo" }).click();
});

test("navigation", async ({ page }) => {
  await page.goto("/navigation");
  await page.getByRole("link", { name: "set Query" }).click();
  await page.getByTestId("a=b&c=d").click();
});
