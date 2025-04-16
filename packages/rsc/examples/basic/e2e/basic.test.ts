import { type Page, expect, test } from "@playwright/test";
import { createReloadChecker, testNoJs, waitForHydration } from "./helper";

test("basic", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
});

test("client component", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await page.getByRole("button", { name: "Client Counter: 1" }).click();
});

test("server action @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await using _ = await createReloadChecker(page);
  await testAction(page);
});

testNoJs("server action @nojs", async ({ page }) => {
  await page.goto("/");
  await testAction(page);
});

async function testAction(page: Page) {
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await page.getByRole("button", { name: "Server Counter: 1" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 2" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Server Reset" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 0" }),
  ).toBeVisible();
}
