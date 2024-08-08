import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#worker-classic")).toContainText(
    '"workerDep": "ok", "workerDepDynamic": "ok"',
  );
  await expect(page.locator("#worker-esm")).toContainText(
    '"workerDep": "ok", "workerDepDynamic": "ok"',
  );
  await expect(page.locator("#worker-wasm")).toContainText(
    '{"type":"Program","start":0,"end":9',
  );
  await expect(page.locator("#worker-emscripten-esm")).toContainText(
    '{ "esm": "hello, EXPORT_ES6!", "modularize": "hello, MODULARIZE!" }',
  );
});
