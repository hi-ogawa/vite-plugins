import { type Page, expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";
import {
  expectNoReload,
  waitForHydration as waitForHydrationBase,
} from "./helper";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/island", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/island", mode: "build" });
  defineTest(f);
});

test.describe("remix", () => {
  test.describe("dev", () => {
    const f = useFixture({ root: "examples/remix", mode: "dev" });
    defineTest(f);
  });

  test.describe("build", () => {
    const f = useFixture({ root: "examples/remix", mode: "build" });
    defineTest(f);
  });
});

function defineTest(f: Fixture) {
  const exampleType = f.root.includes("examples/remix") ? "remix" : "preact";
  const waitForHydration = async (page: Page, locator?: string) => {
    await waitForHydrationBase(
      page,
      locator || (exampleType === "preact" ? "demo-island" : ".counter-card"),
    );
  };

  test("basic", async ({ page }) => {
    await page.goto(f.url());

    const errors: Error[] = [];
    page.on("pageerror", (error) => {
      errors.push(error);
    });

    // hydration
    await waitForHydration(page);
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
    test("component hmr", async ({ page }) => {
      test.skip(exampleType === "remix");

      await page.goto(f.url());
      await waitForHydration(page);
      await using _ = await expectNoReload(page);

      await testClient(page);

      const jsFile = f.createEditor("src/islands/counter.tsx");
      jsFile.edit((s) => s.replace("Count:", "Count-edit:"));

      await expect(page.locator(".counter-card")).toContainText(
        "Count-edit: 3",
      );

      // test SSR is also updated
      const res = await page.request.get(page.url());
      expect(await res.text()).toContain("Count-edit:");

      jsFile.reset();
      await expect(page.locator(".counter-card")).toContainText("Count: 3");

      await testCss(page);
    });

    test("hmr css", async ({ page }) => {
      await page.goto(f.url());
      await waitForHydration(page);
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

    if (exampleType === "remix") {
      test("hmr server", async ({ page }) => {
        await page.goto(f.url());
        await waitForHydration(page);
        await using _ = await expectNoReload(page);

        const file = f.createEditor("src/routes/index.tsx");
        file.edit((s) =>
          s.replace("Island Framework", "Island-edit-Framework"),
        );
        await expect(page.locator(".hero")).toContainText(
          "Island-edit-Framework",
        );
        file.reset();
        await expect(page.locator(".hero")).toContainText("Island Framework");
      });
    }
  }

  if (exampleType === "remix") {
    test("frame", async ({ page }) => {
      await page.goto(f.url("/books"));
      await using _ = await expectNoReload(page);
      await waitForHydrationBase(page, ".cart-button");
      await testFrame(page);
    });

    test.describe(() => {
      test.use({ javaScriptEnabled: false });
      test("frame nojs", async ({ page }) => {
        await page.goto(f.url("/books"));
        await testFrame(page);
      });
    });

    async function testFrame(page: Page) {
      await expect(page.locator(".book-card").nth(0)).toContainText(
        "The Great Gatsby",
      );
      await expect(page.locator(".book-card").nth(1)).toContainText(
        "To Kill a Mockingbird",
      );

      // test form
      await expect(page.locator(".book-card button").nth(0)).toContainText(
        "Add to Cart",
      );
      await page.locator(".book-card button").nth(0).click();
      await expect(page.locator(".book-card button").nth(0)).toContainText(
        "Remove from Cart",
      );
      await page.locator(".book-card button").nth(0).click();
      await expect(page.locator(".book-card button").nth(0)).toContainText(
        "Add to Cart",
      );
    }
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
