import { test } from "@playwright/test";
import {
  type FixtureHelper,
  setupFixtureBuild,
  setupFixtureDev,
  waitForHydration,
} from "./helper";

test.describe("ssg dev", () => {
  const f = setupFixtureDev({
    root: "examples/ssg",
  });
  defineTestSsg(f);
});

test.describe("ssg build", () => {
  const f = setupFixtureBuild({
    root: "examples/ssg",
  });
  defineTestSsg(f);
});

function defineTestSsg(f: FixtureHelper) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);

    if (f.mode === "build") {
      await page.reload();
      await waitForHydration(page);
    }
  });
}
