import { test } from "@playwright/test";
import { createReloadChecker, testNoJs, waitForHydration } from "./helper";

test("basic @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByText("Home Page").click();

  await using _ = await createReloadChecker(page);
  await page.getByRole("link", { name: "Counter" }).click();
  await page.waitForURL("/counter");
  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "-" }).click();
  await page.getByText("Count: 0").click();
});

testNoJs("basic @nojs", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Home Page").click();

  await page.getByRole("link", { name: "Counter" }).click();
  await page.goto("/counter");
  await page.getByText("Count: 0").click();
});
