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

test("@dev common hmr", async ({ page }) => {
  checkNoError(page);

  await page.goto("/test");
  await page.getByText("Common component (from server)").click();
  await page.getByText("Common component (from client)").click();
  await page.getByText("hydrated: true").click();

  const checkClientState = await setupCheckClientState(page);

  await editFile("./src/components/common.tsx", (s) =>
    s.replace("Common component", "Common (EDIT) component")
  );
  await page.getByText("Common (EDIT) component (from server)").click();
  await page.getByText("Common (EDIT) component (from client)").click();
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

test("css", async ({ page }) => {
  await page.goto("/test");
  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "700"
  );
});

test("@dev css hmr", async ({ page }) => {
  await page.goto("/test");
  await page.getByText("hydrated: true").click();

  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "700"
  );
  await editFile("./src/components/header.tsx", (s) =>
    s.replace("font-bold", "font-light")
  );
  await expect(page.getByRole("heading", { name: "RSC Experiment" })).toHaveCSS(
    "font-weight",
    "300"
  );
});

test("server action with js", async ({ page }) => {
  await page.goto("/test/action");

  const checkClientState = await setupCheckClientState(page);

  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+1" }).first().click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "+1" }).nth(1).click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "+1" }).nth(2).click();
  await page.getByText("Count: 3").click();
  await page.getByRole("button", { name: "-1" }).first().click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "-1" }).nth(1).click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "-1" }).nth(2).click();
  await page.getByText("Count: 0").click();

  await checkClientState();
});

test("server action no js", async ({ browser }) => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto("/test/action");
  await page.getByText("Count: 0").click();
  await page.getByRole("button", { name: "+1" }).first().click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "+1" }).nth(1).click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "+1" }).nth(2).click();
  await page.getByText("Count: 3").click();
  await page.getByRole("button", { name: "-1" }).first().click();
  await page.getByText("Count: 2").click();
  await page.getByRole("button", { name: "-1" }).nth(1).click();
  await page.getByText("Count: 1").click();
  await page.getByRole("button", { name: "-1" }).nth(2).click();
  await page.getByText("Count: 0").click();
});

test("use client > virtual module", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("VirtualUseClient").click();
});

test("use client > 3rd party lib", async ({ page }) => {
  await page.goto("/test/deps");
  await page.getByText("TestDepUseClient").click();
});

async function setupCheckClientState(page: Page) {
  // setup client state
  await page.getByPlaceholder("test-input").fill("hello");

  return async () => {
    // verify client state is preserved
    await expect(page.getByPlaceholder("test-input")).toHaveValue("hello");
  };
}
