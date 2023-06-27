import { Page, expect, test } from "@playwright/test";

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
    await page.getByText('{"message":"success on server!"}').click();
  });

  test("server-side-bad", async ({ page }) => {
    await page.goto("/server-redirect/forbidden");
    await page.waitForURL("/server-redirect?error=server");
  });

  test("client-side-good", async ({ page }) => {
    await page.goto("/server-redirect");
    await isPageReady(page);
    await page.getByRole("link", { name: "good link" }).click();
    await page.waitForURL("/server-redirect/good");
    await page.getByText('{"message":"success on client!"}').click();
  });

  test("client-side-bad", async ({ page }) => {
    await page.goto("/server-redirect");
    await isPageReady(page);
    await page.getByRole("link", { name: "forbidden link" }).click();
    // TODO: if we suspend the query, will react-router doesn't update url until resolution?
    await page.waitForURL("/server-redirect/forbidden");
    await page.getByText("something went wrong...").click();
    await page.waitForURL("/server-redirect?error=client");
  });
});

async function isPageReady(page: Page) {
  await page.getByTestId("hydrated").waitFor({ state: "attached" });
}
