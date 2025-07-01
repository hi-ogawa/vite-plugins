import { expect, test } from "@playwright/test";
import {
  type FixtureHelper,
  createEditor,
  expectNoReload,
  setupFixtureBuild,
  setupFixtureDev,
  testNoJs,
  waitForHydration,
} from "./helper";

const root = "examples/starter";

test.describe("dev", () => {
  const f = setupFixtureDev({ root });
  defineTest("dev", f);
});

test.describe("build", () => {
  const f = setupFixtureBuild({ root });
  defineTest("build", f);
});

function defineTest(mode: "dev" | "build", f: FixtureHelper) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);
  });

  test("client component", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);
    await page.getByRole("button", { name: "Client Counter: 0" }).click();
    await expect(
      page.getByRole("button", { name: "Client Counter: 1" }),
    ).toBeVisible();
  });

  test("server action @js", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);
    await using _ = await expectNoReload(page);
    await page.getByRole("button", { name: "Server Counter: 0" }).click();
    await expect(
      page.getByRole("button", { name: "Server Counter: 1" }),
    ).toBeVisible();
  });

  testNoJs("server action @nojs", async ({ page }) => {
    await page.goto(f.url());
    await page.getByRole("button", { name: "Server Counter: 1" }).click();
    await expect(
      page.getByRole("button", { name: "Server Counter: 2" }),
    ).toBeVisible();
  });

  const testDev = mode === "build" ? test.skip : test;
  testDev("client hmr", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);
    await page.getByRole("button", { name: "Client Counter: 0" }).click();
    await expect(
      page.getByRole("button", { name: "Client Counter: 1" }),
    ).toBeVisible();

    const editor = createEditor(`${root}/src/client.tsx`);
    editor.edit((s) => s.replace("Client Counter", "Client [edit] Counter"));
    await expect(
      page.getByRole("button", { name: "Client [edit] Counter: 1" }),
    ).toBeVisible();

    // check next ssr is also updated
    const res = await page.goto(f.url());
    expect(await res?.text()).toContain("Client [edit] Counter");
    editor.reset();
    await page.getByRole("button", { name: "Client Counter: 0" }).click();
  });

  test("image assets", async ({ page }) => {
    await page.goto(f.url());
    await waitForHydration(page);
    await expect(page.getByAltText("Vite logo")).not.toHaveJSProperty(
      "naturalWidth",
      0,
    );
    await expect(page.getByAltText("React logo")).not.toHaveJSProperty(
      "naturalWidth",
      0,
    );
  });
}
