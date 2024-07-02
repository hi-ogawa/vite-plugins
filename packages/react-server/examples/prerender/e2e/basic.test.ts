import { Page, test } from "@playwright/test";
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

  await testDyanmicRoute(page);
});

testNoJs("basic @nojs", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Home Page").click();

  await page.getByRole("link", { name: "Counter" }).click();
  await page.goto("/counter");
  await page.getByText("Count: 0").click();

  await testDyanmicRoute(page);
});

async function testDyanmicRoute(page: Page) {
  await page.getByRole("link", { name: "Posts" }).click();
  await page.waitForURL("/posts");
  await page.getByText("Select a post from the menu.").click();
  await page.getByRole("link", { name: "qui est esse" }).click();
  await page.waitForURL("/posts/2");
}

test("hybrid @js @build", async ({ page }) => {
  await page.goto("/posts");
  await waitForHydration(page);
  await using _ = await createReloadChecker(page);
  await testHybrid(page, { js: true });
});

testNoJs("hybrid @nojs @build", async ({ page }) => {
  await page.goto("/posts");
  await testHybrid(page, { js: false });
});

async function testHybrid(page: Page, options: { js: boolean }) {
  await page.getByRole("link", { name: "qui est esse" }).click();
  await page.waitForURL("/posts/2");
  await page.getByText("[prerendered at").click();

  await page.getByRole("link", { name: "nesciunt quas odio" }).click();
  await page.waitForURL("/posts/5");
  await page.getByText("Loading...").click();
  if (options.js) {
    await page.getByText("[dynamically rendered at").click();
  }
}
