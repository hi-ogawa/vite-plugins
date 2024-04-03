import { range } from "@hiogawa/utils";
import { describe, expect, it } from "vitest";
import { generateRouteTree } from "../features/router/tree";
import { getPathPrefixes } from "../features/router/utils";
import { type RouteTreeNode, renderRouteMap } from "./router";

describe(generateRouteTree, () => {
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
    const input = Object.fromEntries(
      files.map((k) => [k, async () => ({ default: k })]),
    );
    const tree = generateRouteTree(input) as RouteTreeNode;
    expect(tree).toMatchInlineSnapshot(`
      {
        "children": {
          "": {
            "children": {
              "demo": {
                "value": {
                  "layout": [Function],
                  "page": [Function],
                },
              },
              "other": {
                "value": {
                  "page": [Function],
                },
              },
              "test": {
                "children": {
                  "[dynamic]": {
                    "children": {
                      "hello": {
                        "value": {
                          "page": [Function],
                        },
                      },
                    },
                    "value": {
                      "page": [Function],
                    },
                  },
                  "other": {
                    "value": {
                      "page": [Function],
                    },
                  },
                },
                "value": {
                  "layout": [Function],
                  "page": [Function],
                },
              },
            },
            "value": {
              "layout": [Function],
              "page": [Function],
            },
          },
        },
      }
    `);

    function testMatch(pathname: string) {
      const request = { url: "https://test.local" + pathname };
      return renderRouteMap(tree, request as any as Request);
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
      expect(await testMatch(testCase)).matchSnapshot(`(${i}) "${testCase}"`);
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
