import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/basic", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/basic", mode: "build" });
  defineTest(f);
});

function defineTest(f: Fixture) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await expect(page.getByTestId("client")).toHaveText("Client counter: 0");
    await page.getByTestId("client").click();
    await expect(page.getByTestId("client")).toHaveText("Client counter: 1");
  });
}
