import { test } from "@playwright/test";
import { getSessionCookie, isPageReady } from "./helper";

test.describe("session", () => {
  test("basic", async ({ page }) => {
    await page.goto("/session");
    await isPageReady(page);

    await page.getByText("login name = (undefined)").click();
    await page.getByRole("link", { name: "/session/login" }).click();

    await page.waitForURL("/session/login");
    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("asdf");
    await page.getByLabel("Name").press("Enter");

    await page.waitForURL("/session");
    await page.getByText("login name = asdf").click();
    await page.getByRole("link", { name: "/session/me" }).click();

    await page.waitForURL("/session/me");
    await page.getByText("Hello, asdf").click();
    await page.getByRole("button", { name: "Logout" }).click();

    await page.waitForURL("/session");
    await page.getByText("login name = (undefined)").click();
  });

  test("redirect-1", async ({ page }) => {
    await page.goto("/session");
    await isPageReady(page);

    await page.getByRole("link", { name: "/session/me" }).click();
    await page.waitForURL("/session/login?redirected");

    await page.goto("/session/me");
    await page.waitForURL("/session/login?redirected");
  });

  test("redirect-2", async ({ page }) => {
    await page.goto("/session/login");
    await isPageReady(page);

    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("asdf");
    await page.getByLabel("Name").press("Enter");
    await page.waitForURL("/session");

    await page.getByRole("link", { name: "/session/login" }).click();
    await page.waitForURL("/session/me?redirected");

    await page.goto("/session/login");
    await page.waitForURL("/session/me?redirected");
  });

  test("session-fixture", async ({ page }) => {
    const cookie = await getSessionCookie("abcd");
    const [name, value] = cookie.split(";")[0]!.split("=") as any;
    await page
      .context()
      .addCookies([{ name, value, domain: "localhost", path: "/" }]);
    await page.goto("/session");
    await page.getByText("login name = abcd").click();
  });
});
