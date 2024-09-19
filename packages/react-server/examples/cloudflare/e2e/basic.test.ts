import { test } from "@playwright/test";
import { waitForHydration } from "./helper";

test("basic", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page);
  await page.getByText("Server Counter: 0").click();
  await page
    .getByTestId("server-counter")
    .getByRole("button", { name: "+" })
    .click();

  await page.reload();
  await waitForHydration(page);
  await page.getByText("Server Counter: 1").click();
  await page
    .getByTestId("server-counter")
    .getByRole("button", { name: "-" })
    .click();
  await page.getByText("Server Counter: 0").click();
});
