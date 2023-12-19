import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (e) => pageErrors.push(e));

  await page.goto("/");
  await page.getByTestId("hydrated").waitFor();
  await page.getByText("Counter: 0").click();
  await page.getByRole("button", { name: "+1" }).click();
  await page.getByText("Counter: 1").click();

  expect(pageErrors).toEqual([]);
});

test("server error", async ({ page }) => {
  await page.goto("/crash-ssr");
  await page
    .getByText(
      "[vite-node-miniflare error] Error: crash ssr at App (eval:11:11) at eval:674:45 "
    )
    .click();
});
