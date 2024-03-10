import { expect, test } from "@playwright/test";
import { checkNoError, editFile } from "./helper";

test("basic", async ({ page }) => {
  checkNoError(page);

  await page.goto("/");
  await page.getByText("hydrated: true").click();
});

test("navigation", async ({ page }) => {
  checkNoError(page);

  await page.goto("/");
  await page.getByText("hydrated: true").click();

  // setup client state
  await page.getByPlaceholder("test-hmr").fill("hello");

  await page.getByRole("link", { name: "/other" }).click();
  await page.getByText("Other Page").click();
  await page.waitForURL("/other");

  // verify client state is preserved
  await expect(page.getByPlaceholder("test-hmr")).toHaveValue("hello");
});

test("404", async ({ page }) => {
  checkNoError(page);

  const res = await page.goto("/not-found");
  expect(res?.status()).toBe(404);
  await page.getByText("Not Found: /not-found").click();
});

test("@dev rsc reload", async ({ page }) => {
  checkNoError(page);

  await page.goto("/");
  await page.getByRole("heading", { name: "[RSC Experiment]" }).click();
  await page.getByText("hydrated: true").click();

  await editFile("./src/components/header.tsx", (s) =>
    s.replace("[RSC Experiment]", "[RSC Experiment (EDIT)]")
  );
  await page.getByRole("heading", { name: "[RSC Experiment (EDIT)]" }).click();
  await page.getByText("hydrated: true").click();
});

test("@dev client hmr", async ({ page }) => {
  checkNoError(page);

  await page.goto("/");
  await page.getByText("hydrated: true").click();

  // setup client state
  await page.getByPlaceholder("test-hmr").fill("hello");

  // modify client comopnent
  await page.getByText("test-hmr-div").click();
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div")
  );
  await page.getByText("test-hmr-edit-div").click();

  // verify client state is preserved
  await expect(page.getByPlaceholder("test-hmr")).toHaveValue("hello");
});
