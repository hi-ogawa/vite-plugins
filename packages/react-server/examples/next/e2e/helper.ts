import fs from "node:fs";
import { expect, type Page, test } from "@playwright/test";

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
