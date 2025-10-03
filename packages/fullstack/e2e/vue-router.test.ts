import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";
import { expectNoReload, waitForHydration } from "./helper";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/vue-router", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/vue-router", mode: "build" });
  defineTest(f);
});

test.describe("build ssg", () => {
  const f = useFixture({
    root: "examples/vue-router",
    mode: "build",
    command: "pnpm preview-ssg",
    buildCommand: "pnpm build-ssg",
  });
  defineTest(f);
});

function defineTest(f: Fixture) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await using _ = await expectNoReload(page);

    const errors: Error[] = [];
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    // hydration
    await waitForHydration(page, "#root");
    expect(errors).toEqual([]); // no hydration mismatch

    // client
    await expect(page.locator(".counter-card")).toContainText("Count: 0");
    await page.getByRole("button", { name: "Increment" }).click();
    await expect(page.locator(".counter-card")).toContainText("Count: 1");

    // css
    // - styles.css
    await expect(page.getByRole("button", { name: "Increment" })).toHaveCSS(
      "background-color",
      "rgb(83, 91, 242)",
    );
    // - index.vue (scoped css)
    await expect(
      page.getByRole("heading", { name: "Vue Router Custom Framework" }),
    ).toHaveCSS("color", "rgb(100, 108, 255)");

    expect(errors).toEqual([]);
  });

  // TODO: hmr
}
