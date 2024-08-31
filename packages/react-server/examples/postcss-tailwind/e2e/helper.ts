import fs from "node:fs";
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

export function createEditor(filepath: string) {
  const init = fs.readFileSync(filepath, "utf-8");
  let next = init;
  return {
    edit(editFn: (data: string) => string) {
      next = editFn(next);
      fs.writeFileSync(filepath, next);
    },
    [Symbol.dispose]() {
      fs.writeFileSync(filepath, init);
    },
  };
}

export async function createReloadChecker(page: Page) {
  await page.evaluate(() => {
    const el = document.createElement("meta");
    el.setAttribute("name", "x-reload-check");
    document.head.append(el);
  });

  return {
    async [Symbol.asyncDispose]() {
      await page.waitForTimeout(300);
      await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
        timeout: 1,
      });
    },
  };
}
