import { describe, expect, it } from "vitest";
import { type RouteNode, generateRouteTree, matchRoute } from "./routing";

describe(generateRouteTree, () => {
  it("basic", () => {
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
    const tree = generateRouteTree(input);
    expect(tree).toMatchInlineSnapshot(`
      {
        "children": {
          "": {
            "children": {
              "demo": {
                "value": {
                  "layout": "/demo/layout.tsx",
                  "page": "/demo/page.tsx",
                },
              },
              "other": {
                "value": {
                  "page": "/other/page.tsx",
                },
              },
              "test": {
                "children": {
                  "[dynamic]": {
                    "children": {
                      "hello": {
                        "value": {
                          "page": "/test/[dynamic]/hello/page.tsx",
                        },
                      },
                    },
                    "value": {
                      "page": "/test/[dynamic]/page.tsx",
                    },
                  },
                  "other": {
                    "value": {
                      "page": "/test/other/page.tsx",
                    },
                  },
                },
                "value": {
                  "layout": "/test/layout.tsx",
                  "page": "/test/page.tsx",
                },
              },
            },
            "value": {
              "layout": "/layout.tsx",
              "page": "/page.tsx",
            },
          },
        },
      }
    `);

    function testMatch(pathname: string) {
      const result = matchRoute(pathname, tree as RouteNode);
      return {
        ...result,
        nodes: result.nodes.map((node) => node.value),
      };
    }

    expect(testMatch("/")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
        ],
        "notFound": false,
        "params": {},
      }
    `);
    expect(testMatch("/other")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "page": "/other/page.tsx",
          },
        ],
        "notFound": false,
        "params": {},
      }
    `);
    expect(testMatch("/not-found")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
        ],
        "notFound": true,
        "params": {},
      }
    `);
    expect(testMatch("/test")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "layout": "/test/layout.tsx",
            "page": "/test/page.tsx",
          },
        ],
        "notFound": false,
        "params": {},
      }
    `);
    expect(testMatch("/test/other")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "layout": "/test/layout.tsx",
            "page": "/test/page.tsx",
          },
          {
            "page": "/test/other/page.tsx",
          },
        ],
        "notFound": false,
        "params": {},
      }
    `);
    expect(testMatch("/test/other/not-found")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "layout": "/test/layout.tsx",
            "page": "/test/page.tsx",
          },
          {
            "page": "/test/other/page.tsx",
          },
        ],
        "notFound": true,
        "params": {},
      }
    `);
    expect(testMatch("/test/anything")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "layout": "/test/layout.tsx",
            "page": "/test/page.tsx",
          },
          {
            "page": "/test/[dynamic]/page.tsx",
          },
        ],
        "notFound": false,
        "params": {
          "dynamic": "anything",
        },
      }
    `);
    expect(testMatch("/test/anything/not-found")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
          {
            "layout": "/test/layout.tsx",
            "page": "/test/page.tsx",
          },
          {
            "page": "/test/[dynamic]/page.tsx",
          },
        ],
        "notFound": true,
        "params": {
          "dynamic": "anything",
        },
      }
    `);
    expect(testMatch("/not-found1/not-found2")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": "/layout.tsx",
            "page": "/page.tsx",
          },
        ],
        "notFound": true,
        "params": {},
      }
    `);
  });
});
