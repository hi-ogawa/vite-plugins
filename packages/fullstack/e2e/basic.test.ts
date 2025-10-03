import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";
import { expectNoReload, waitForHydration } from "./helper";

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
    await using _ = await expectNoReload(page);

    const errors: Error[] = [];
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    // hydration
    await waitForHydration(page, "main");
    expect(errors).toEqual([]); // no hydration mismatch

    // client
    await expect(
      page.getByRole("button", { name: "count is 0" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "count is 0" }).click();
    await expect(
      page.getByRole("button", { name: "count is 1" }),
    ).toBeVisible();

    // css
    await expect(page.locator(".read-the-docs")).toHaveCSS(
      "color",
      "rgb(136, 136, 136)",
    );
    expect(errors).toEqual([]);
  });

  // TODO
  if (f.mode === "dev") {
    test("hmr js", async ({ page }) => {
      page;
    });

    test("hmr css", async ({ page }) => {
      page;
    });
  }

  test.describe(() => {
    test.use({ javaScriptEnabled: false });

    test("ssr", async ({ page }) => {
      await page.goto(f.url());

      // ssr
      await expect(
        page.getByRole("button", { name: "count is 0" }),
      ).toBeVisible();

      // css
      await expect(page.locator(".read-the-docs")).toHaveCSS(
        "color",
        "rgb(136, 136, 136)",
      );

      // modulepreload
      // TODO
    });
  });
}
