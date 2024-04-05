import { test } from "@playwright/test";
import { checkNoError } from "./helper";

test("dynamic routes", async ({ page }) => {
  checkNoError(page);
  await page.goto("/test/dynamic");
  await page.getByText("file: /test/dynamic/page.tsx").click();
  await page.getByText("pathname: /test/dynamic").click();
  await page.getByText("params: {}").click();

  await page.getByRole("link", { name: "• /test/dynamic/static" }).click();
  await page.getByText("file: /test/dynamic/static/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/static").click();
  await page.getByText("params: {}").click();

  await page
    .getByRole("link", { name: "• /test/dynamic/abc", exact: true })
    .click();
  await page.getByText("file: /test/dynamic/[id]/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/abc").click();
  await page.getByText('params: {"id":"abc"}').click();

  await page.getByRole("link", { name: "• /test/dynamic/abc/def" }).click();
  await page.getByText("file: /test/dynamic/[id]/[nested]/page.tsx").click();
  await page.getByText("pathname: /test/dynamic/abc/def").click();
  await page.getByText('params: {"id":"abc","nested":"def"}').click();
});
