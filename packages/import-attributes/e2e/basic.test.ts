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
  test("import binary file with type attribute", async ({ page }) => {
    await page.goto(f.url());

    // Verify that the binary file was imported and decoded correctly
    const appContent = page.locator("#app");
    await expect(appContent).toHaveText("data.bin: hello, dynamic.bin: world");
  });
}
