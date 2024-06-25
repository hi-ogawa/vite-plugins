import { type Page, expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await page.getByRole("img", { name: "Next.js logo" }).click();
});

test("navigation link", async ({ page }) => {
  await page.goto("/navigation");
  await waitForHydration(page);
  await page.getByRole("link", { name: "set Query" }).click();
  await page.getByText("a=b&c=d").click();
  await page.waitForURL("/navigation?a=b&c=d");
});

test("navigation router", async ({ page }) => {
  await page.goto("/navigation/router");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Test routing" }).click();
  await page.getByText("slug:1").click();
  await page.waitForURL("/navigation/router/dynamic-gsp/1");
});

async function waitForHydration(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-test-state",
    "hydrated",
  );
}
