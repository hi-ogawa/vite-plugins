import { expect, test } from "@playwright/test";
import { type FixtureHelper, useFixture, waitForHydration } from "./helper";

test.describe("ssg dev", () => {
  const f = useFixture({
    root: "examples/ssg",
    mode: "dev",
  });
  defineTestSsg(f);
});

test.describe("ssg build", () => {
  const f = useFixture({
    root: "examples/ssg",
    mode: "build",
  });
  defineTestSsg(f);
});

function defineTestSsg(f: FixtureHelper) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);

    if (f.mode === "build") {
      const t1 = await page.getByTestId("timestamp").textContent();
      await page.waitForTimeout(100);
      await page.reload();
      await waitForHydration(page);
      const t2 = await page.getByTestId("timestamp").textContent();
      expect(t2).toBe(t1);
    }
  });
}
