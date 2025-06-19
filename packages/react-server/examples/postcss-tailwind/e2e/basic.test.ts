import { expect, type Page, test } from "@playwright/test";
import {
  createEditor,
  createReloadChecker,
  testNoJs,
  waitForHydration,
} from "./helper";

test("basic @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testBasic(page);
});

testNoJs("basic @nojs", async ({ page }) => {
  await page.goto("/");
  await testBasic(page);
});

async function testBasic(page: Page) {
  await expect(page.getByRole("button", { name: "Test Server:" })).toHaveCSS(
    "padding-left",
    "8px",
  );
  await expect(page.getByRole("button", { name: "Test Client:" })).toHaveCSS(
    "padding-left",
    "8px",
  );
}

test("server hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await using _ = await createReloadChecker(page);

  using file = createEditor("app/page.tsx");
  file.edit((t) =>
    t.replace('<button className="p-2 ', '<button className="p-4 '),
  );

  await expect(page.getByRole("button", { name: "Test Server:" })).toHaveCSS(
    "padding-left",
    "16px",
  );
});

test("cliet hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await using _ = await createReloadChecker(page);

  using file = createEditor("app/_client.tsx");
  file.edit((t) => t.replace('className="p-2 ', 'className="p-4 '));
  await expect(page.getByRole("button", { name: "Test Client:" })).toHaveCSS(
    "padding-left",
    "16px",
  );
});
