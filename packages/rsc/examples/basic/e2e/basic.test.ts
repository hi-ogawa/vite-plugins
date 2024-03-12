import { type Page, expect, test } from "@playwright/test";
import { checkNoError, editFile } from "./helper";

test("basic", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByText("hydrated: true").click();
});

test("navigation", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByText("hydrated: true").click();

  const checkClientState = await setupCheckClientState(page);

  await page.getByRole("link", { name: "/test/other" }).click();
  await page.getByText("Other Page").click();
  await page.waitForURL("/test/other");

  await checkClientState();
});

test("404", async ({ page }) => {
  checkNoError(page);

  const res = await page.goto("/test/not-found");
  expect(res?.status()).toBe(404);
  await page.getByText("Not Found: /test/not-found").click();
});

test("@dev rsc hmr", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByRole("heading", { name: "RSC Experiment" }).click();
  await page.getByText("hydrated: true").click();

  const checkClientState = await setupCheckClientState(page);

  await editFile("./src/components/header.tsx", (s) =>
    s.replace("RSC Experiment", "RSC (EDIT) Experiment")
  );
  await page.getByRole("heading", { name: "RSC (EDIT) Experiment" }).click();
  await page.getByText("hydrated: true").click();

  await checkClientState();
});

test.skip("@dev common hmr", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByRole("heading", { name: "RSC Experiment" }).click();
  await page.getByText("hydrated: true").click();

  const checkClientState = await setupCheckClientState(page);

  await editFile("./src/components/header.tsx", (s) =>
    s.replace("RSC Experiment", "RSC (EDIT) Experiment")
  );
  await page.getByRole("heading", { name: "RSC (EDIT) Experiment" }).click();
  await page.getByText("hydrated: true").click();

  await checkClientState();
});

test("@dev client hmr", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByText("hydrated: true").click();

  const checkClientState = await setupCheckClientState(page);

  // modify client comopnent
  await page.getByText("test-hmr-div").click();
  await editFile("./src/components/counter.tsx", (s) =>
    s.replace("test-hmr-div", "test-hmr-edit-div")
  );
  await page.getByText("test-hmr-edit-div").click();

  await checkClientState();

  // SSR should also use a fresh module
  const res = await page.request.get("/test");
  expect(await res.text()).toContain("<div>test-hmr-edit-div</div>");
});

test.skip("css", async ({ page }) => {
  page;
});

test.skip("@dev css hmr", async ({ page }) => {
  page;
});

async function setupCheckClientState(page: Page) {
  // setup client state
  await page.getByPlaceholder("test-input").fill("hello");

  return async () => {
    // verify client state is preserved
    await expect(page.getByPlaceholder("test-input")).toHaveValue("hello");
  };
}
