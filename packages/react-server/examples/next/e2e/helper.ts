import { type Page, expect, test } from "@playwright/test";

export async function waitForHydration(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-test-state",
    "hydrated",
  );
}

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});
