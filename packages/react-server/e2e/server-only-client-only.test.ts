import { test } from "@playwright/test";

// TODO
// - how to setup fixture project?
//   - create minimal starter and copy it?
// - how to add dependency?
//   - using next is easier?
//   - testing only with local link package?

test.describe("server only", () => {
  test("success", () => {
    "vite build";
  });

  test("error", () => {});
});

test.describe("client only", () => {
  test("success", () => {});

  test("error", () => {});
});
