import { expect, test } from "@playwright/test";

test.skip("basic", async ({ page }) => {
  await page.goto("/");
  await page.locator("#root.hydrated").waitFor({ state: "attached" });

  await page.getByText("Index page").click();
  await page.getByRole("link", { name: "Loader Data" }).click();
  await page.getByText('loaderData = { "message": "hello loader" }').click();
  await page.getByRole("link", { name: "Hello API" }).click();
  await page.getByText('{"message":"hello api"}').click();

  const res = await page.goto("/loader-data");
  expect(res?.status()).toBe(200);
  expect(await res?.text()).toContain(
    "&quot;message&quot;: &quot;hello loader&quot"
  );
});
