import process from "node:process";
import { tinyassert } from "@hiogawa/utils";
import { expect, test } from "@playwright/test";
import { isPageReady } from "./helper";

// TODO: test production build
const isPreview = Boolean(process.env["E2E_COMMAND"]?.includes("preview"));

test("ssr", async ({ request }) => {
  test.skip(isPreview);

  const res = await request.get("/loader-data");
  tinyassert(res.ok);

  const resText = await res.text();
  const links = [
    ...resText.matchAll(/<link rel="modulepreload" href="(.*?)" \/\>/g),
  ].map((m) => m[0]);
  expect(links).toEqual([
    '<link rel="modulepreload" href="/src/routes/layout.tsx" />',
    '<link rel="modulepreload" href="/src/routes/loader-data.page.tsx" />',
  ]);
});

test("client", async ({ page }) => {
  test.skip(isPreview);

  await page.goto("/loader-data");
  await isPageReady(page);

  // preload after mouseover
  const preloadRequests = Promise.all([
    page.waitForRequest("/src/routes/subdir/layout.tsx"),
    page.waitForRequest("/src/routes/subdir/other.page.tsx"),
  ]);
  await page
    .getByRole("link", { name: "/subdir/other" })
    .dispatchEvent("mouseover");
  await preloadRequests;
});
