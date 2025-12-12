import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/basic", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/basic", mode: "build" });
  defineTest(f);
});

function defineTest(f: Fixture) {
  test("client counter", async ({ page }) => {
    await page.goto(f.url());
    await expect(page.getByTestId("client-increment")).toBeVisible();
    await expect(page.getByTestId("client-decrement")).toBeVisible();

    // Check initial value
    const clientValue = page.locator(".counter-card.client .counter-value");
    await expect(clientValue).toHaveText("0");

    // Test increment
    await page.getByTestId("client-increment").click();
    await expect(clientValue).toHaveText("1");

    // Test decrement
    await page.getByTestId("client-decrement").click();
    await expect(clientValue).toHaveText("0");
  });

  test("server counter", async ({ page }) => {
    await page.goto(f.url());
    await expect(page.getByTestId("server-increment")).toBeVisible();
    await expect(page.getByTestId("server-decrement")).toBeVisible();

    const serverValue = page.locator(".counter-card.server .counter-value");

    // Wait for initial load from server
    await expect(serverValue).not.toHaveText("", { timeout: 5000 });

    // Get current value
    const currentValue = await serverValue.textContent();
    const currentCount = Number(currentValue);

    // Test increment - verify it increases by 1
    await page.getByTestId("server-increment").click();
    await expect(serverValue).toHaveText(String(currentCount + 1), {
      timeout: 5000,
    });

    // Test increment again - verify it increases again
    await page.getByTestId("server-increment").click();
    await expect(serverValue).toHaveText(String(currentCount + 2), {
      timeout: 5000,
    });

    // Test decrement - verify it decreases by 1
    await page.getByTestId("server-decrement").click();
    await expect(serverValue).toHaveText(String(currentCount + 1), {
      timeout: 5000,
    });
  });
}
