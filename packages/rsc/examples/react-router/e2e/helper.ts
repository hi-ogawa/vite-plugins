import { readFileSync, writeFileSync } from "fs";
import { tinyassert } from "@hiogawa/utils";
import test, { type Page, expect } from "@playwright/test";

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
  await expect(page.getByTestId("hydrated")).toHaveText("[hydrated: 1]");
}

export async function expectNoReload(page: Page) {
  // inject custom meta
  await page.evaluate(() => {
    const el = document.createElement("meta");
    el.setAttribute("name", "x-reload-check");
    document.head.append(el);
  });

  return {
    [Symbol.asyncDispose]: async () => {
      // check if meta is preserved
      await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
        timeout: 1,
      });
    },
  };
}

export function createEditor(filepath: string) {
  const init = readFileSync(filepath, "utf-8");
  return {
    edit(editFn: (data: string) => string) {
      const next = editFn(init);
      tinyassert(next !== init);
      writeFileSync(filepath, next);
    },
    [Symbol.dispose]() {
      writeFileSync(filepath, init);
    },
  };
}
