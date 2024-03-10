import { expect, test } from "@playwright/test";
import { checkNoError, editFile } from "./helper";

test("basic", async ({ page }) => {
  checkNoError(page);

  await page.goto("/");
  await page.getByText("hydrated: true").click();
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
  await page.getByPlaceholder("test-hmr-input").fill("hello");

  // modify client comopnent
  await page.getByText("test-hmr-div").click();
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div")
  );
  await page.getByText("test-hmr-edit-div").click();

  // verify client state is preserved
  await expect(page.getByPlaceholder("test-hmr-input")).toHaveValue("hello");
});
