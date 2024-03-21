import fs from "node:fs";
import test, { type Page, expect } from "@playwright/test";

//
// page error check
//

const pageErrorsMap = new WeakMap<Page, Error[]>();

test.afterEach(({ page }) => {
  const errors = pageErrorsMap.get(page);
  if (errors) {
    expect(errors).toEqual([]);
  }
});

export function checkNoError(page: Page) {
  const pageErrors: Error[] = [];
  pageErrorsMap.set(page, pageErrors);
  page.on("pageerror", (e) => pageErrors.push(e));
}

//
// file edit utils
//

const originalFileMap = new Map<string, string>();

test.afterEach(async () => {
  for (const [filepath, data] of originalFileMap) {
    await fs.promises.writeFile(filepath, data);
  }
  originalFileMap.clear();
});

export async function editFile(
  filepath: string,
  edit: (data: string) => string,
) {
  const data = await fs.promises.readFile(filepath, "utf-8");
  if (!originalFileMap.has(filepath)) {
    originalFileMap.set(filepath, data);
  }
  await fs.promises.writeFile(filepath, edit(data));
}
