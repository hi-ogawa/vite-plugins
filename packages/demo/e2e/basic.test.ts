import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("hydrated").waitFor({ state: "attached" });

  await page.getByRole("button", { name: "Fetch API" }).click();
  await page.getByText('{ "env": ').click();

  await page.getByRole("link", { name: "/other", exact: true }).click();
  await page.waitForURL("/other");
  await page.getByText("Other page").click();

  await page.getByRole("link", { name: "/some-dynamic-id" }).click();
  await page.waitForURL("/some-dynamic-id");
  await page.getByText('params = { "dynamic": "some-dynamic-id" }').click();

  await page.getByRole("link", { name: "/subdir", exact: true }).click();
  await page.waitForURL("/subdir");
  await page.getByText("Sub directory (index)").click();

  await page.getByRole("link", { name: "/subdir/other" }).click();
  await page.waitForURL("/subdir/other");
  await page.getByText("Sub directory (other)").click();

  // SPA can load non root url
  await page.goto("/some-dynamic-id");
  await page.waitForURL("/some-dynamic-id");
  await page.getByText('params = { "dynamic": "some-dynamic-id" }').click();
});

test.describe("server-data", () => {
  test("server-side", async ({ page }) => {
    await page.goto("/server-data");
    await page.getByRole("img").click();
    await page
      .getByText(
        '{ "types": [ { "slot": 1, "type": { "name": "electric", "url": "https://pokeapi.'
      )
      .click();
  });

  test("client-side-navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("hydrated").waitFor({ state: "attached" });

    await page.getByRole("link", { name: "/server-data", exact: true }).click();
    await page.waitForURL("/server-data");
    await page.getByRole("img").click();
    await page
      .getByText(
        '{ "types": [ { "slot": 1, "type": { "name": "electric", "url": "https://pokeapi.'
      )
      .click();
  });

  test("ssr", async ({ request }) => {
    const res = await request.get("/server-data");
    const resText = await res.text();
    expect(resText).toContain(
      `src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"`
    );
  });
});
