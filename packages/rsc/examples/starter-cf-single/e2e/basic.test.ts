import { expect, test } from "@playwright/test";
import {
  createEditor,
  expectNoReload,
  testNoJs,
  waitForHydration,
} from "./helper";

test("basic", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
});

test("client component", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();
});

test("server action @js", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await using _ = await expectNoReload(page);
  await page.getByRole("button", { name: "Server Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 1" }),
  ).toBeVisible();
});

testNoJs("server action @nojs", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Server Counter: 1" }).click();
  await expect(
    page.getByRole("button", { name: "Server Counter: 2" }),
  ).toBeVisible();
});

test("client hmr @dev", async ({ page }) => {
  await page.goto("./");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
  await expect(
    page.getByRole("button", { name: "Client Counter: 1" }),
  ).toBeVisible();

  const editor = createEditor("./src/client.tsx");
  editor.edit((s) => s.replace("Client Counter", "Client [edit] Counter"));
  await expect(
    page.getByRole("button", { name: "Client [edit] Counter: 1" }),
  ).toBeVisible();

  // check next ssr is also updated
  const res = await page.goto("./");
  expect(await res?.text()).toContain("Client [edit] Counter");
  editor.reset();
  await page.getByRole("button", { name: "Client Counter: 0" }).click();
});
