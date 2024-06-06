import test, { type Page, expect } from "@playwright/test";

export async function waitForHydration(page: Page) {
  await expect(page.locator("#hydrated")).toHaveAttribute(
    "data-hydrated",
    "true",
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function createReloadChecker(page: Page) {
  async function reset() {
    await page.evaluate(() => {
      const el = document.createElement("meta");
      el.setAttribute("name", "x-reload-check");
      document.head.append(el);
    });
  }

  async function check() {
    await sleep(300);
    await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
      timeout: 1,
    });
  }

  await reset();

  return {
    check,
    reset,
    [Symbol.asyncDispose]: check,
  };
}

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});
