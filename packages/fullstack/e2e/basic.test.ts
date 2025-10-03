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

test.describe("cloudflare dev", () => {
  const f = useFixture({ root: "examples/cloudflare", mode: "dev" });
  defineTest(f);
});

test.describe("cloudflare build", () => {
  const f = useFixture({ root: "examples/cloudflare", mode: "build" });
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
    // - App.css
    await expect(page.locator(".read-the-docs")).toHaveCSS(
      "color",
      "rgb(136, 136, 136)",
    );
    // - index.css
    await expect(page.locator("button")).toHaveCSS(
      "background-color",
      "rgb(249, 249, 249)",
    );

    expect(errors).toEqual([]);
  });

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
      if (f.mode === "build") {
        await expect(page.locator("link[rel='modulepreload']")).toBeAttached();
      }
    });
  });

  if (f.mode === "dev") {
    test("hmr react", async ({ page }) => {
      await page.goto(f.url());
      await using _ = await expectNoReload(page);

      await expect(
        page.getByRole("button", { name: "count is 0" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "count is 0" }).click();
      await expect(
        page.getByRole("button", { name: "count is 1" }),
      ).toBeVisible();

      const jsFile = f.createEditor("src/App.tsx");
      jsFile.edit((s) => s.replace("count is", "count (edit) is"));

      await expect(
        page.getByRole("button", { name: "count (edit) is 1" }),
      ).toBeVisible();

      jsFile.reset();
      await expect(
        page.getByRole("button", { name: "count is 1" }),
      ).toBeVisible();
    });

    test("hmr css", async ({ page }) => {
      await page.goto(f.url());
      await using _ = await expectNoReload(page);

      await expect(
        page.getByRole("button", { name: "count is 0" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "count is 0" }).click();
      await expect(
        page.getByRole("button", { name: "count is 1" }),
      ).toBeVisible();

      const cssFile = f.createEditor("src/App.css");
      cssFile.edit((s) =>
        s.replace("color: rgb(136, 136, 136);", "color: rgb(36, 36, 36);"),
      );
      await expect(page.locator(".read-the-docs")).toHaveCSS(
        "color",
        "rgb(36, 36, 36)",
      );
      cssFile.reset();
      await expect(page.locator(".read-the-docs")).toHaveCSS(
        "color",
        "rgb(136, 136, 136)",
      );

      await expect(
        page.getByRole("button", { name: "count is 1" }),
      ).toBeVisible();
    });
  }
}
