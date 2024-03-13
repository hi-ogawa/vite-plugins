import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");
  await page.locator("body.hydrated").waitFor({ state: "attached" });

  // verify client-side state is preserved
  await page.getByPlaceholder("debug state").fill("test");

  await page.getByRole("link", { name: "Loader/Action Demo" }).click();
  await page.waitForURL("/demo");
  await expect(page.getByPlaceholder("debug state")).toHaveValue("test");

  await page.getByText("counter = 0").click();
  await page.getByRole("button", { name: "+1" }).click();
  await page.getByText("counter = 1").click();
  await expect(page.getByPlaceholder("debug state")).toHaveValue("test");
});

// test style is applied without JS
test.describe("no-js", () => {
  test.use({ javaScriptEnabled: false });

  test("style", async ({ page }) => {
    await page.goto("/style");
    await expect(page.getByText("Some Styled Box")).toHaveCSS(
      "height",
      "123px",
    );
  });
});
