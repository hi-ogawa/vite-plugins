import { range } from "@hiogawa/utils";
import { describe, expect, it } from "vitest";
import { getPathPrefixes } from "../features/router/utils";
import { generateRouteModuleTree, renderRouteMap } from "./router";

describe(generateRouteModuleTree, () => {
  it("basic", async () => {
    const files = [
      "/layout.tsx",
      "/page.tsx",
      "/other/page.tsx",
      "/test/layout.tsx",
      "/test/page.tsx",
      "/test/other/page.tsx",
      "/test/[dynamic]/page.tsx",
      "/test/[dynamic]/hello/page.tsx",
      "/demo/layout.tsx",
      "/demo/page.tsx",
    ];
    const input = Object.fromEntries(files.map((k) => [k, { default: k }]));
    const tree = generateRouteModuleTree(input);
    expect(tree).toMatchSnapshot();

    async function testMatch(pathname: string) {
      const match = await renderRouteMap(tree, {
        url: "https://test.local" + pathname,
        headers: new Headers(),
      });
      return {
        // inject pathname for the ease of reading snapshot
        __pathname: pathname,
        ...match,
      };
    }

    const testCases = [
      "/",
      "/other",
      "/not-found",
      "/test",
      "/test/other",
      "/test/not-found",
    ];
    for (const i of range(testCases.length)) {
      const testCase = testCases[i]!;
      expect(await testMatch(testCase)).matchSnapshot();
    }
  });
});

describe(getPathPrefixes, () => {
  it("basic", () => {
    expect(getPathPrefixes("/")).toMatchInlineSnapshot(`
      [
        "/",
      ]
    `);
    expect(getPathPrefixes("/hello")).toMatchInlineSnapshot(`
      [
        "/",
        "/hello",
      ]
    `);
    expect(getPathPrefixes("/hello/world")).toMatchInlineSnapshot(`
      [
        "/",
        "/hello",
        "/hello/world",
      ]
    `);
  });
});
