import fs from "node:fs";
import test, { type Page, expect } from "@playwright/test";

export function checkNoError(page: Page) {
  const pageErrors: Error[] = [];
  page.on("pageerror", (e) => pageErrors.push(e));
  page.on("close", () => expect(pageErrors).toEqual([]));
}

const originalFileMap = new Map<string, string>();

test.afterEach(async () => {
  for (const [filepath, data] of originalFileMap) {
    await fs.promises.writeFile(filepath, data);
  }
  originalFileMap.clear();
});

export async function editFile(
  filepath: string,
  edit: (data: string) => string
) {
  const data = await fs.promises.readFile(filepath, "utf-8");
  if (!originalFileMap.has(filepath)) {
    originalFileMap.set(filepath, data);
  }
  await fs.promises.writeFile(filepath, edit(data));
}
