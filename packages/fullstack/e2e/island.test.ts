import { type Page, expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";
import { expectNoReload, waitForHydration } from "./helper";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/island", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/island", mode: "build" });
  defineTest(f);
});

function defineTest(f: Fixture) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());

    const errors: Error[] = [];
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    // hydration
    await waitForHydration(page, "demo-island");
    expect(errors).toEqual([]); // no hydration mismatch

    await testClient(page);
    await testCss(page);
    await testNavigation(page);

    expect(errors).toEqual([]);
  });

  test.describe(() => {
    test.use({ javaScriptEnabled: false });

    test("ssr", async ({ page }) => {
      await page.goto(f.url());
      await expect(page.locator(".counter-card")).toContainText("Count: 2");
      await testCss(page);
      if (f.mode === "build") {
        await expect(
          page.locator("link[rel='modulepreload']").first(),
        ).toBeAttached();
      }
    });
  });

  if (f.mode === "dev") {
    test("preact hmr", async ({ page }) => {
      await page.goto(f.url());
      await waitForHydration(page, "demo-island");
      await using _ = await expectNoReload(page);

      await testClient(page);

      const jsFile = f.createEditor("src/components/counter.tsx");
      jsFile.edit((s) => s.replace("Count:", "Count-edit:"));

      await expect(page.locator(".counter-card")).toContainText(
        "Count-edit: 3",
      );

      jsFile.reset();
      await expect(page.locator(".counter-card")).toContainText("Count: 3");

      await testCss(page);
    });

    test("hmr css", async ({ page }) => {
      await page.goto(f.url());
      await waitForHydration(page, "demo-island");
      await using _ = await expectNoReload(page);

      await testClient(page);

      // scoped css
      const cssFile = f.createEditor("src/routes/index.css");
      cssFile.edit((s) =>
        s.replace("color: rgb(100, 108, 255);", "color: rgb(0, 0, 255);"),
      );
      await expect(
        page.getByRole("heading", { name: "Island Framework" }),
      ).toHaveCSS("color", "rgb(0, 0, 255)");
      cssFile.reset();

      // css is restored
      await testCss(page);
    });
  }
}

async function testClient(page: Page) {
  await expect(page.locator(".counter-card")).toContainText("Count: 2");
  await page.getByRole("button", { name: "Increment" }).click();
  await expect(page.locator(".counter-card")).toContainText("Count: 3");
}

async function testCss(page: Page) {
  // styles.css
  await expect(page.getByRole("button", { name: "Increment" })).toHaveCSS(
    "background-color",
    "rgb(83, 91, 242)",
  );
  // index.css
  await expect(
    page.getByRole("heading", { name: "Island Framework" }),
  ).toHaveCSS("color", "rgb(100, 108, 255)");
}

async function testNavigation(page: Page) {
  await page.getByRole("link", { name: "About" }).click();
  await page.waitForURL("**/about");
  await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
}
