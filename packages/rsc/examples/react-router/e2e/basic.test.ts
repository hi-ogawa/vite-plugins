import fs from "node:fs";
import { expect, test } from "@playwright/test";
import {
  createEditor,
  expectNoReload,
  testNoJs,
  waitForHydration,
} from "./helper";

test("loader", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText(`loaderData: {"name":"Unknown"}`)).toBeVisible();
});

test("client", async ({ page }) => {
  await page.goto("./about");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client counter: 1" }),
  ).toBeVisible();
});

test("navigation", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);

  await page.getByText("This is the home page.").click();

  await page.getByRole("link", { name: "About" }).click();
  await page.waitForURL("/about");
  await page.getByText("This is the about page.").click();

  await page.getByRole("link", { name: "Home" }).click();
  await page.waitForURL("/");
  await page.getByText("This is the home page.").click();
});

testNoJs("ssr modulepreload @build", async ({ page }) => {
  await page.goto("./");
  const srcs = await page
    .locator(`head >> link[rel="modulepreload"]`)
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
  const viteManifest = JSON.parse(
    fs.readFileSync("dist/client/.vite/manifest.json", "utf-8"),
  );
  const file = "/" + viteManifest["app/routes/home.client.tsx"].file;
  expect(srcs).toContain(file);
});

test("client hmr @dev", async ({ page }) => {
  await page.goto("./about");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);

  await page.getByRole("button", { name: "Client counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client counter: 1" }),
  ).toBeVisible();

  using editor = createEditor("./app/routes/about.tsx");
  editor.edit((s) => s.replace("Client counter:", "Client [edit] counter:"));

  await expect(
    page.getByRole("button", { name: "Client [edit] counter: 1" }),
  ).toBeVisible();
});

test("server hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);

  await page.getByText("This is the home page.").click();

  using editor = createEditor("./app/routes/home.tsx");
  editor.edit((s) =>
    s.replace("This is the home page.", "This is the home [edit] page."),
  );

  await page.getByText("This is the home [edit] page.").click();
});
