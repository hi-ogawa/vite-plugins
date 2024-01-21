import process from "node:process";
import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (e) => pageErrors.push(e));

  await page.goto("/");
  await page.getByTestId("hydrated").waitFor();
  await page.getByText("Counter: 0").click();
  await page.getByRole("button", { name: "+1" }).click();
  await page.getByText("Counter: 1").click();

  expect(pageErrors).toEqual([]);
});

test("server error", async ({ request }) => {
  test.fail();

  const res = await request.get("/crash-ssr");
  expect(res.status()).toBe(500);

  let text = await res.text();
  text = text.replaceAll(/[/].*node_modules/gm, "__NODE_MODULES__");
  text = text.replaceAll(process.cwd(), "__CWD__");
  expect(text).toMatch(`\
[vite-node-miniflare error]
Error: crash ssr
    at Module.crash (__CWD__/src/crash-dep.ts:3:9)
    at CrashSsr (__CWD__/src/crash.tsx:5:5)
    at __NODE_MODULES__/@hiogawa/tiny-react/dist/index.js`);
});
