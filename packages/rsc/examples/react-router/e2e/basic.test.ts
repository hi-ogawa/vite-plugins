import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("loader", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(`loaderData: {"name":"Unknown"}`)).toBeVisible();
});

test("client", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByTestId("hydrated")).toHaveText("[hydrated: 1]");
  await page.getByRole("button", { name: "Client counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client counter: 1" }),
  ).toBeVisible();
});

test("navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("hydrated")).toHaveText("[hydrated: 1]");
  await page.getByText("This is the home page.").click();
  await page.getByTestId("client-state").fill("ok");

  await page.getByRole("link", { name: "About" }).click();
  await page.waitForURL("/about");
  await page.getByText("This is the about page.").click();
  await expect(page.getByTestId("client-state")).toHaveValue("ok");

  await page.getByRole("link", { name: "Home" }).click();
  await page.waitForURL("/");
  await page.getByText("This is the home page.").click();
  await expect(page.getByTestId("client-state")).toHaveValue("ok");
});

const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});

testNoJs("ssr modulepreload @build", async ({ page }) => {
  await page.goto("./");
  const srcs = await page
    .locator(`head >> link[rel="modulepreload"]`)
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("href")));
  const viteManifest = JSON.parse(
    fs.readFileSync("dist/client/.vite/manifest.json", "utf-8"),
  );
  const file = "/" + viteManifest["src/routes/home.client.tsx"].file;
  expect(srcs).toContain(file);
});
