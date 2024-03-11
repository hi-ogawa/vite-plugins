import { describe, expect, it } from "vitest";
import { generateRouteTree, matchRoute } from "./routing";

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
      const result = matchRoute(pathname, tree);
      return {
        ...result,
        nodes: result.nodes.map((node) => node.value),
      };
    }

    expect(testMatch("/")).toMatchInlineSnapshot(`
      {
        "nodes": [
          {
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "page": {
              "default": "/other/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "layout": {
              "default": "/test/layout.tsx",
            },
            "page": {
              "default": "/test/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "layout": {
              "default": "/test/layout.tsx",
            },
            "page": {
              "default": "/test/page.tsx",
            },
          },
          {
            "page": {
              "default": "/test/other/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "layout": {
              "default": "/test/layout.tsx",
            },
            "page": {
              "default": "/test/page.tsx",
            },
          },
          {
            "page": {
              "default": "/test/other/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "layout": {
              "default": "/test/layout.tsx",
            },
            "page": {
              "default": "/test/page.tsx",
            },
          },
          {
            "page": {
              "default": "/test/[dynamic]/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
          {
            "layout": {
              "default": "/test/layout.tsx",
            },
            "page": {
              "default": "/test/page.tsx",
            },
          },
          {
            "page": {
              "default": "/test/[dynamic]/page.tsx",
            },
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
            "layout": {
              "default": "/layout.tsx",
            },
            "page": {
              "default": "/page.tsx",
            },
          },
        ],
        "notFound": true,
        "params": {},
      }
    `);
  });
});
