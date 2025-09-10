import { globSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { type Fixture, useFixture } from "./fixture";

test.describe("dev", () => {
  const f = useFixture({ root: "examples/basic", mode: "dev" });
  defineTest(f);
});

test.describe("build", () => {
  const f = useFixture({ root: "examples/basic", mode: "build" });
  defineTest(f);

  test("cache-control", async ({ request }) => {
    // not immutable asset
    {
      const res = await request.get(f.url("/favicon.ico"));
      expect(res.headers()).toMatchObject({
        "content-type": "image/vnd.microsoft.icon",
      });
      expect(res.headers()["cache-control"]).toBeFalsy();
    }

    // immutable asset
    {
      const files = globSync("assets/index-*.js", {
        cwd: path.join(f.root, "dist/client"),
      });
      const res = await request.get(f.url("/" + files[0]));
      expect(res.headers()).toMatchObject({
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "public, max-age=31536000, immutable",
      });
    }
  });
});

function defineTest(f: Fixture) {
  test("basic", async ({ page }) => {
    await page.goto(f.url());
    await expect(page.getByTestId("client")).toHaveText("Client counter: 0");
    await page.getByTestId("client").click();
    await expect(page.getByTestId("client")).toHaveText("Client counter: 1");
  });
}
