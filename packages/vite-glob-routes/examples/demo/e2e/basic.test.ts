import { tinyassert } from "@hiogawa/utils";
import { type Page, expect, test } from "@playwright/test";
import { isPageReady, testNoJs } from "./helper";

test("basic", async ({ page }) => {
  await page.goto("/");
  await isPageReady(page);

  await page.getByRole("button", { name: "Fetch API" }).click();
  await page.getByText('{ "env": ').click();

  await page.getByRole("link", { name: "/dynamic/any" }).click();
  await page.waitForURL("/dynamic/any");
  await page.getByText('params = { "id": "any" }').click();

  await page.getByRole("link", { name: "/subdir", exact: true }).click();
  await page.waitForURL("/subdir");
  await page.getByText("Sub directory (index)").click();

  await page.getByRole("link", { name: "/subdir/other" }).click();
  await page.waitForURL("/subdir/other");
  await page.getByText("Sub directory (other)").click();

  // SPA can load non root url
  await page.goto("/dynamic/any");
  await page.waitForURL("/dynamic/any");
  await page.getByText('params = { "id": "any" }').click();
});

test.describe("response-status-code", () => {
  test("200", async ({ page }) => {
    const res = await page.goto("/");
    tinyassert(res);
    expect(res.status()).toBe(200);
  });

  test("404", async ({ page }) => {
    const res = await page.goto("/no-such-route");
    tinyassert(res);
    expect(res.status()).toBe(404);
    await page.getByText('{ "status": 404, "statusText": "Not Found"').click();
  });
});

test.describe("loader-data", () => {
  test("ssr", async ({ page }) => {
    await page.goto("/loader-data");
    await page.getByText("counter = 0").click();
  });

  test("csr", async ({ page, request }) => {
    await page.goto("/");
    await isPageReady(page);

    await page.getByRole("link", { name: "/loader-data" }).click();
    await page.waitForURL("/loader-data");
    await page.getByText("counter = 0").click();
    await page.getByRole("button", { name: "+1" }).click();
    await page.getByText("counter = 1").click();

    // verify ssr loader data
    const res = await request.get("/loader-data");
    const resText = await res.text();
    expect(resText).toContain("<span>counter = <!-- -->1</span>");

    await page.getByRole("button", { name: "-1" }).click();
    await page.getByText("counter = 0").click();
  });
});

test.describe("layout-loader", () => {
  async function assetUseMatches(page: Page) {
    await expect(page.getByTestId("/")).toHaveText(`{
      "id": "/",
      "pathname": "/",
      "params": {},
      "data": null,
      "handle": "root-handle"
    }`);
    await expect(page.getByTestId("/subdir/")).toHaveText(`{
      "id": "/subdir/",
      "pathname": "/subdir",
      "params": {},
      "data": {
        "message": "for layout"
      },
      "handle": "subdir-handle"
    }`);
    await expect(page.getByTestId("/subdir/other")).toHaveText(`{
      "id": "/subdir/other",
      "pathname": "/subdir/other",
      "params": {},
      "data": {
        "message": "for other"
      },
      "handle": "subdir-other-handle"
    }`);
  }

  test("ssr", async ({ page }) => {
    await page.goto("/subdir/other");
    await assetUseMatches(page);
  });

  test("navigation", async ({ page }) => {
    await page.goto("/");
    await isPageReady(page);
    await page.getByRole("link", { name: "/subdir/other" }).click();
  });
});

test.describe("server-redirect", () => {
  test("server-side-good", async ({ page }) => {
    await page.goto("/server-redirect/good");
    await page.waitForURL("/server-redirect/good");
    await page.getByText('{"ok":true,"message":"good"}').click();
  });

  test("server-side-bad", async ({ page }) => {
    await page.goto("/server-redirect/forbidden");
    await page.waitForURL("/server-redirect?loader-throw");
  });

  test("status-code", async ({ request }) => {
    const res = await request.get("/server-redirect/forbidden", {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    expect(res.headers()["location"]).toBe("/server-redirect?loader-throw");
  });

  test("client-side-good", async ({ page }) => {
    await page.goto("/server-redirect");
    await isPageReady(page);
    await page.getByRole("link", { name: "good link" }).click();
    await page.waitForURL("/server-redirect/good");
    await page.getByText('{"ok":true,"message":"good"}').click();
  });

  test("client-side-bad", async ({ page }) => {
    await page.goto("/server-redirect");
    await isPageReady(page);
    await page.getByRole("link", { name: "forbidden link" }).click();
    await page.waitForURL("/server-redirect?loader-throw");
  });
});

test.describe("ErrorBoundary", () => {
  test("navigation", async ({ page }) => {
    await page.goto("/error");
    await isPageReady(page);

    await page.getByRole("link", { name: "ok" }).click();
    await page.getByText('loaderData = { "id": "ok" }').click();

    await page.getByRole("link", { name: "error response" }).click();
    await page
      .getByText('{ "status": 400, "statusText": "Bad Request"')
      .click();
    await page.getByRole("button", { name: "Reset" }).click();

    await page.getByRole("link", { name: "exception (loader)" }).click();
    await page.getByText("loader boom!", { exact: true }).click();
    await page.getByRole("button", { name: "Reset" }).click();

    await page.getByRole("link", { name: "exception (render)" }).click();
    await page.getByText("render boom!", { exact: true }).click();
  });

  test.describe("ssr", () => {
    test("error-response", async ({ page }) => {
      const res = await page.goto("/error?id=error-response");
      tinyassert(res);
      expect(res.status()).toBe(400);
      await page.getByText('{ "status": 400').click();
    });

    test("exception-loader", async ({ page }) => {
      const res = await page.goto("/error?id=exception-loader");
      tinyassert(res);
      expect(res.status()).toBe(500);
      await page.getByText("loader boom!", { exact: true }).click();
    });

    test("exception-render", async ({ page }) => {
      const res = await page.goto("/error?id=exception-render");
      tinyassert(res);
      expect(res.status()).toBe(500);
      await page.getByText("render boom!", { exact: true }).click();
    });
  });
});

test("api-dynamic-route", async ({ page }) => {
  await page.goto("/api/dynamic/hello");
  await page.getByText('{"params":{"hee":"hello"}}').click();

  await page.goto("/api/dynamic/hello/goodbye");
  await page.getByText('{"params":{"hey":"hello","foo":"goodbye"}}').click();

  const res = await page.goto("/api/dynamic/hello/goodbye/again");
  expect(res?.status()).toBe(404);
});

test("style @js", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveCSS("display", "flex");
});

testNoJs("style @nojs", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header")).toHaveCSS("display", "flex");
});
