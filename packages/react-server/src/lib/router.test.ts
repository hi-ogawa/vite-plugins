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
    expect(tree).toMatchInlineSnapshot(`
      {
        "children": {
          "": {
            "children": {
              "demo": {
                "value": {
                  "layout": {
                    "default": "/demo/layout.tsx",
                  },
                  "page": {
                    "default": "/demo/page.tsx",
                  },
                },
              },
              "other": {
                "value": {
                  "page": {
                    "default": "/other/page.tsx",
                  },
                },
              },
              "test": {
                "children": {
                  "[dynamic]": {
                    "children": {
                      "hello": {
                        "value": {
                          "page": {
                            "default": "/test/[dynamic]/hello/page.tsx",
                          },
                        },
                      },
                    },
                    "value": {
                      "page": {
                        "default": "/test/[dynamic]/page.tsx",
                      },
                    },
                  },
                  "other": {
                    "value": {
                      "page": {
                        "default": "/test/other/page.tsx",
                      },
                    },
                  },
                },
                "value": {
                  "layout": {
                    "default": "/test/layout.tsx",
                  },
                  "page": {
                    "default": "/test/page.tsx",
                  },
                },
              },
            },
            "value": {
              "layout": {
                "default": "/layout.tsx",
              },
              "page": {
                "default": "/page.tsx",
              },
            },
          },
        },
      }
    `);

    function testMatch(pathname: string) {
      return renderRouteMap(tree, {
        url: "https://test.local" + pathname,
        headers: new Headers(),
      });
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
