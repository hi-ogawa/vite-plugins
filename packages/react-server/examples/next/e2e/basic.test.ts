import { expect, test } from "@playwright/test";
import { testNoJs, waitForHydration } from "./helper";

test("basic", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await page.getByRole("img", { name: "Next.js logo" }).click();
});

test("navigation Link", async ({ page }) => {
  await page.goto("/navigation");
  await waitForHydration(page);
  await page.getByRole("link", { name: "set Query" }).click();
  await page.getByText("a=b&c=d").click();
  await page.waitForURL("/navigation?a=b&c=d");
});

test("navigation useRouter", async ({ page }) => {
  await page.goto("/navigation/router");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Test routing" }).click();
  await page.getByText("slug:1").click();
  await page.waitForURL("/navigation/router/dynamic-gsp/1");
});

test("navigation redirect", async ({ page }) => {
  await page.goto("/navigation/redirect/servercomponent");
  await page.waitForURL("/navigation/redirect/result");
  await page.getByText("Result Page").click();
});

test("navigation permanentRedirect", async ({ page }) => {
  await page.goto("/navigation/redirect/servercomponent-2");
  await page.waitForURL("/navigation/redirect/result");
  await page.getByText("Result Page").click();
});

test("navigation notFound", async ({ page }) => {
  const res = await page.goto("/navigation/not-found/servercomponent");
  expect(res?.status()).toBe(404);
  await page.getByText("Not Found!").click();
});

test("action server", async ({ page }) => {
  await page.goto("/actions/server");
  await waitForHydration(page);
  await expect(page.locator("#count")).toContainText("0");
  await page.getByRole("button", { name: "+1", exact: true }).click();
  await expect(page.locator("#count")).toContainText("1");
  await page.getByRole("button", { name: "*2" }).click();
  await expect(page.locator("#count")).toContainText("2");
  await page.getByRole("button", { name: "*2" }).click();
  await expect(page.locator("#count")).toContainText("4");
  await page.getByRole("button", { name: "-1" }).click();
  await expect(page.locator("#count")).toContainText("3");
  await page.getByRole("button", { name: "redirect" }).click();
  await page.waitForURL("/");
});

test("action client", async ({ page }) => {
  await page.goto("/actions/client");
  await waitForHydration(page);
  await expect(page.locator("#count")).toContainText("0");
  await page.getByRole("button", { name: "+1", exact: true }).click();
  await expect(page.locator("#count")).toContainText("1");
  await page.getByRole("button", { name: "*2" }).click();
  await expect(page.locator("#count")).toContainText("2");
  await page.getByRole("button", { name: "*2" }).click();
  await expect(page.locator("#count")).toContainText("4");
  await page.getByRole("button", { name: "-1" }).click();
  await expect(page.locator("#count")).toContainText("3");
  await page.getByRole("button", { name: "redirect" }).click();
  await page.waitForURL("/");
});

test("favicon.ico", async ({ request }) => {
  const res = await request.get("/favicon.ico");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/x-icon");
});

test("viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(`meta[name="viewport"]`)).toHaveAttribute(
    "content",
    "width=device-width, initial-scale=1",
  );
});

testNoJs("image preload", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.locator('link[href="https://nextjs.org/icons/next.svg"]'),
  ).toHaveAttribute("fetchPriority", "high");
  await expect(
    page.locator('link[href="https://nextjs.org/icons/vercel.svg"]'),
  ).not.toHaveAttribute("fetchPriority", "high");
});

test("middleware basic", async ({ request }) => {
  {
    const res = await request.get("/test/middleware/response");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({
      hello: ["from", "middleware"],
    });
  }

  {
    const res = await request.get("/test/middleware/headers");
    expect(res.status()).toBe(404);
    expect(res.headers()).toMatchObject({
      "x-hello": "world",
    });
  }

  {
    const res = await request.get("/test/middleware/cookies");
    expect(res.status()).toBe(404);
    expect(res.headers()).toMatchObject({
      "set-cookie": "x-hello=world; Path=/",
    });
  }
});

test("middleware flight redirect @js", async ({ page }) => {
  await page.goto("/test");
  await waitForHydration(page);
  await page.getByRole("link", { name: "/test/middleware/redirect" }).click();
  await page.waitForURL("/?ok=redirect");
  await page.getByRole("img", { name: "Next.js logo" }).click();
});

testNoJs("middleware flight redirect @nojs", async ({ page }) => {
  await page.goto("/test");
  await page.getByRole("link", { name: "/test/middleware/redirect" }).click();
  await page.waitForURL("/?ok=redirect");
  await page.getByRole("img", { name: "Next.js logo" }).click();
});
