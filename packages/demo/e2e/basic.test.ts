import { type Page, expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");
  await isPageReady(page);

  await page.getByRole("button", { name: "Fetch API" }).click();
  await page.getByText('{ "env": ').click();

  await page.getByRole("link", { name: "/other", exact: true }).click();
  await page.waitForURL("/other");
  await page.getByText("Other page").click();

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
  test("200", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
  });

  test("404", async ({ request }) => {
    const res = await request.get("/noooooo");
    expect(res.status()).toBe(404);
  });
});

test.describe("loader-data", () => {
  test("ssr", async ({ page }) => {
    // TOOD: assert there's no client request to "/loader-data_data.json"?
    await page.goto("/loader-data");
    await page.getByText('{ "message": "hello loader data" }').click();
  });

  test("navigation", async ({ page }) => {
    await page.goto("/");
    await isPageReady(page);

    await page.getByRole("link", { name: "/loader-data" }).click();
    await page.getByText('{ "message": "hello loader data" }').click();
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

test.describe("server-data", () => {
  test("ssr", async ({ page }) => {
    await page.goto("/server-data");
    await page.getByText("counter = 0").click();
  });

  test("csr", async ({ page, request }) => {
    await page.goto("/");
    await page.getByTestId("hydrated").waitFor({ state: "attached" });

    await page.getByRole("link", { name: "/server-data" }).click();
    await page.waitForURL("/server-data");
    await page.getByText("counter = 0").click();
    await page.getByRole("button", { name: "+1" }).click();
    await page.getByText("counter = 1").click();

    // verify ssr prefetch
    const res = await request.get("/server-data");
    const resText = await res.text();
    expect(resText).toContain("<span>counter = <!-- -->1</span>");

    await page.getByRole("button", { name: "-1" }).click();
    await page.getByText("counter = 0").click();
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
  test("basic", async ({ page }) => {
    await page.goto("/error");
    await isPageReady(page);
    await page.getByRole("heading", { name: "Page Component" }).click();
    await page.getByRole("button", { name: "Throw" }).click();
    await page
      .getByRole("heading", { name: "ErrorBoundary Component" })
      .click();
    await page.getByText("Error: hey render eror! at onClick").click();
    await page.getByRole("button", { name: "Reset" }).click();
    await page.getByRole("heading", { name: "Page Component" }).click();
  });

  test("ssr", async ({ page, request }) => {
    await page.goto("/no-such-route");
    await page
      .getByText(
        '{ "status": 404, "statusText": "Not Found", "internal": true, "data": "Error: No'
      )
      .click();

    const res = await request.get("/no-such-route");
    expect(res.status()).toBe(404);
  });
});

async function isPageReady(page: Page) {
  await page.getByTestId("hydrated").waitFor({ state: "attached" });
}
