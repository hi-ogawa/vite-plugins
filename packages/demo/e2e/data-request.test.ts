import { URLSearchParams } from "url";
import { expect, test } from "@playwright/test";

test("x-loader-response", async ({ request }) => {
  const res = await request.get(
    "/loader-data?" +
      new URLSearchParams([["x-loader-route-id", "/loader-data"]])
  );
  expect(res.headers()["x-loader-response"]).toBe("1");
});

test("invalid x-loader-route-id", async ({ request }) => {
  const res = await request.get(
    "/loader-data?" + new URLSearchParams([["x-loader-route-id", "/asdfjkl"]])
  );
  expect(res.headers()["x-loader-response"]).toBe("1");
  expect(res.headers()["x-loader-error-response"]).toBe("1");
});
