import { expect, test } from "@playwright/test";

test("basic", async ({ page }) => {
  await page.goto("/");
  await page.locator("#root.hydrated").waitFor({ state: "attached" });

  await page.getByText("Index page").click();

  // loader (client side navigation)
  await page.getByRole("link", { name: "Loader Data" }).click();
  await page.getByText('loaderData = { "message": "hello loader" }').click();

  // GET api
  await page.getByRole("link", { name: "GET API" }).click();
  await page.getByText('{"message":"hello api"}').click();

  // loader (SSR)
  const res = await page.goto("/loader-data");
  expect(res?.status()).toBe(200);
  expect(await res?.text()).toContain(
    "&quot;message&quot;: &quot;hello loader&quot"
  );
});

test("POST api", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox").fill("hello");
  await page.getByRole("button", { name: "POST API" }).click();
  await page
    .getByText(
      '{"method":"POST","message":"hello formData","data":{"input":"hello"}}'
    )
    .click();
});
