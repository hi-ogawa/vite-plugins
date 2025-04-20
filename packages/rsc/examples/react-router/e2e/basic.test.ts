import { expect, test } from "@playwright/test";

test("loader", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("loaderData: hello, world")).toBeVisible();
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
