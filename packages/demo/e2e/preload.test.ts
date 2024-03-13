import process from "node:process";
import { tinyassert } from "@hiogawa/utils";
import { test } from "@playwright/test";
import { isPageReady } from "./helper";

const isPreview = Boolean(process.env["E2E_COMMAND"]?.includes("preview"));

test("modulepreload", async ({ page }) => {
  test.skip(isPreview);

  await page.goto("/loader-data");
  await isPageReady(page);

  // server rendered preload for matching initial routes
  tinyassert(await findPreloadLink("/src/routes/layout.tsx"));
  tinyassert(await findPreloadLink("/src/routes/loader-data.page.tsx"));
  tinyassert(!(await findPreloadLink("/src/routes/subdir/layout.tsx")));
  tinyassert(!(await findPreloadLink("/src/routes/subdir/other.page.tsx")));

  // preload after mouseover
  await page
    .getByRole("link", { name: "/subdir/other" })
    .dispatchEvent("mouseover");
  tinyassert(await findPreloadLink("/src/routes/subdir/layout.tsx"));
  tinyassert(await findPreloadLink("/src/routes/subdir/other.page.tsx"));

  function findPreloadLink(href: string) {
    return page.evaluate(
      (href) => Boolean(document.querySelector(`link[href="${href}"]`)),
      href,
    );
  }
});
