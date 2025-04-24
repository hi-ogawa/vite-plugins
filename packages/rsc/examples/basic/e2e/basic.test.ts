import fs from "node:fs";
import { type Page, expect, test } from "@playwright/test";
import {
  createEditor,
  createReloadChecker,
  testNoJs,
  waitForHydration,
} from "./helper";

test("basic", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
});

test("client component", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await page.getByRole("button", { name: "Client Counter: 1" }).click();
});

test("server action @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await using _ = await createReloadChecker(page);
  await testAction(page);
});

testNoJs("server action @nojs", async ({ page }) => {
  await page.goto("/");
  await testAction(page);
});

async function testAction(page: Page) {
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await page.getByRole("button", { name: "Server Counter: 1" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 2" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Server Reset" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 0" }),
  ).toBeVisible();
}

testNoJs("module preload on ssr @build", async ({ page }) => {
  await page.goto("/");
  const srcs = await Promise.all(
    (await page.locator(`head >> link[rel="modulepreload"]`).all()).map((s) =>
      s.getAttribute("href"),
    ),
  );
  const viteManifest = JSON.parse(
    fs.readFileSync("dist/client/.vite/manifest.json", "utf-8"),
  );
  const file = "/" + viteManifest["src/counter.tsx"].file;
  expect(srcs).toContain(file);
});

test("server reference update @dev @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testServerActionUpdate(page, { js: true });
});

test("server reference update @dev @nojs", async ({ page }) => {
  await page.goto("/");
  await testServerActionUpdate(page, { js: false });
});

async function testServerActionUpdate(page: Page, options: { js: boolean }) {
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 1" }),
  ).toBeVisible();

  // update server code
  using editor = createEditor("src/action.tsx");
  editor.edit((s) =>
    s.replace("const TEST_UPDATE = 1;", "const TEST_UPDATE = 10;"),
  );
  if (!options.js) {
    await expect(async () => {
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Server Counter: 0" }),
      ).toBeVisible({ timeout: 10 });
    }).toPass();
  }

  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 10" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Server Reset" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 0" }),
  ).toBeVisible();
}

test("client hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();

  using editor = createEditor("src/counter.tsx");
  editor.edit((s) => s.replace("Client Counter", "Client [edit] Counter"));
  await expect(
    page.getByRole("button", { name: "Client [edit] Counter: 1" }),
  ).toBeVisible();

  // check next ssr is also updated
  const res = await page.goto("/");
  expect(await res?.text()).toContain("Client [edit] Counter");
});

test("server hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();

  using editor = createEditor("src/server.tsx");
  editor.edit((s) => s.replace("Server Counter", "Server [edit] Counter"));
  await expect(
    page.getByRole("button", { name: "Server [edit] Counter: 0" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();
});

test("css @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testCss(page);
});

testNoJs("css @nojs", async ({ page }) => {
  await page.goto("/");
  await testCss(page);
});

async function testCss(page: Page, color = "rgb(255, 165, 0)") {
  await expect(page.locator(".test-style-client")).toHaveCSS("color", color);
  await expect(page.locator(".test-style-server")).toHaveCSS("color", color);
}

test("css hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testCss(page);

  await using _ = await createReloadChecker(page);
  using editor = createEditor("src/styles.css");
  editor.edit((s) => s.replaceAll("rgb(255, 165, 0)", "rgb(0, 165, 255)"));
  await testCss(page, "rgb(0, 165, 255)");
});

test("tailwind @js", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testTailwind(page);
});

testNoJs("tailwind @nojs", async ({ page }) => {
  await page.goto("/");
  await testTailwind(page);
});

async function testTailwind(page: Page) {
  await expect(page.locator(".test-tw-client")).toHaveCSS(
    "color",
    // blue-500
    "oklch(0.623 0.214 259.815)",
  );
  await expect(page.locator(".test-tw-server")).toHaveCSS(
    "color",
    // red-500
    "oklch(0.637 0.237 25.331)",
  );
}

test("tailwind hmr @dev", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await testTailwind(page);

  await using _ = await createReloadChecker(page);

  using clientFile = createEditor("src/counter.tsx");
  clientFile.edit((s) => s.replaceAll("text-blue-500", "text-blue-600"));
  await expect(page.locator(".test-tw-client")).toHaveCSS(
    "color",
    "oklch(0.546 0.245 262.881)",
  );

  using serverFile = createEditor("src/server.tsx");
  serverFile.edit((s) => s.replaceAll("text-red-500", "text-red-600"));
  await expect(page.locator(".test-tw-server")).toHaveCSS(
    "color",
    "oklch(0.577 0.245 27.325)",
  );
});
