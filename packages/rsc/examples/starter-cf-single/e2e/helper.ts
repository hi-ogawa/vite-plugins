import { readFileSync, writeFileSync } from "fs";
import { tinyassert } from "@hiogawa/utils";
import test, { type Page, expect } from "@playwright/test";

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector(".card");
      if (el) {
        const keys = Object.keys(el);
        return keys.some((key) => key.startsWith("__reactFiber"));
      }
    },
    null,
    { timeout: 3000 },
  );
}

export async function expectNoReload(page: Page) {
  // inject custom meta
  await page.evaluate(() => {
    const el = document.createElement("meta");
    el.setAttribute("name", "x-reload-check");
    document.head.append(el);
  });

  // TODO: playwright prints a weird error on dispose error, so maybe we should avoid this pattern :(
  return {
    [Symbol.asyncDispose]: async () => {
      // check if meta is preserved
      await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
        timeout: 1,
      });
      await page.evaluate(() => {
        document.querySelector(`meta[name="x-reload-check"]`)!.remove();
      });
    },
  };
}

export function createEditor(filepath: string) {
  const init = readFileSync(filepath, "utf-8");
  originalFiles[filepath] ??= init;
  let current = init;
  return {
    edit(editFn: (data: string) => string) {
      const next = editFn(current);
      tinyassert(next !== current);
      current = next;
      writeFileSync(filepath, next);
    },
    reset() {
      writeFileSync(filepath, init);
    },
  };
}

const originalFiles: Record<string, string> = {};

test.afterAll(() => {
  for (const [filepath, content] of Object.entries(originalFiles)) {
    writeFileSync(filepath, content);
  }
});
