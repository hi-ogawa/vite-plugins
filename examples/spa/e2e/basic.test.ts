import { test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");

  // /pokemon
  await page.getByRole("link", { name: "Pokemon API Demo" }).click();
  await page.waitForURL("/pokemon");
  await page.getByText("Choose or input Pokemon above").click();

  // /pokemon/pikachu
  await page.getByRole("link", { name: "pikachu" }).click();
  await page.waitForURL("/pokemon/pikachu");
  await page.getByText("type: electric").click();

  // /pokemon/ditto
  await page.getByPlaceholder("Input...").fill("ditto");
  await page.getByPlaceholder("Input...").press("Enter");
  await page.waitForURL("/pokemon/ditto");
  await page.getByRole("heading", { name: "ditto" }).click();
  await page.getByText("type: normal").click();

  // /pokemon/no-such-pokemon
  await page.getByPlaceholder("Input...").fill("no-such-pokemon");
  await page.getByPlaceholder("Input...").press("Enter");
  await page.waitForURL("/pokemon/no-such-pokemon");
  await page
    .getByRole("heading", { name: "Failed to fetch 'no-such-pokemon'" })
    .click();
});
