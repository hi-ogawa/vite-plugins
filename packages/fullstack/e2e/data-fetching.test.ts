import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";
import { waitForHydration } from "./helper";

test.describe("data-fetching dev", () => {
  const f = useFixture({ root: "examples/data-fetching", mode: "dev" });
  defineTest(f);
});

test.describe("data-fetching build", () => {
  const f = useFixture({ root: "examples/data-fetching", mode: "build" });
  defineTest(f);
});

function defineTest(f: Fixture) {
  test("add new todo item", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);

    // add new todo
    await page.fill(
      'input[placeholder="What needs to be done?"]',
      "Buy groceries",
    );
    await page.press('input[placeholder="What needs to be done?"]', "Enter");
    await expect(
      page.locator("label", { hasText: "Buy groceries" }),
    ).toBeVisible();
    await expect(page.locator("input.new-todo")).toHaveValue("");

    // test SSR
    const res = await page.request.get(page.url());
    expect(await res.text()).toContain("Buy groceries");
  });
}
