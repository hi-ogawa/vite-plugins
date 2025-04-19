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
