import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (e) => pageErrors.push(e));

  await page.goto("/");
  await page.getByText("hydrated: true").click();

  expect(pageErrors).toEqual([]);
});
