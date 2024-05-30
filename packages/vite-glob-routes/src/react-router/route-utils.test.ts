import { objectPick } from "@hiogawa/utils";
import type { DataRouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import {
  createGlobPageRoutes,
  splitPathSegment,
  walkArrayTree,
} from "./route-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const mod = async () => ({});
    const result = createGlobPageRoutes({
      eager: false,
      root: "(root)",
      globPage: {
        "(root)/index.page.js": mod,
        "(root)/other.page.jsx": mod,
        "(root)/[dynamic].page.ts": mod,
        "(root)/subdir/index.page.tsx": mod,
        "(root)/subdir/other.page.tsx": mod,
        "(root)/abc/[dynsub].page.tsx": mod,
        "(root)/abc/[dynsub]/new.page.tsx": mod,
      },
      globPageServer: {
        "(root)/other.page.server.jsx": mod,
      },
      globLayout: {
        "(root)/layout.tsx": mod,
        "(root)/subdir/layout.jsx": mod,
      },
      globLayoutServer: {
        "(root)/layout.server.tsx": mod,
      },
    });

    expect(result.routes).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "id": "/index",
              "index": true,
              "lazy": [Function],
            },
            {
              "id": "/other",
              "lazy": [Function],
              "path": "other",
            },
            {
              "id": "/[dynamic]",
              "lazy": [Function],
              "path": ":dynamic",
            },
            {
              "children": [
                {
                  "id": "/subdir/index",
                  "index": true,
                  "lazy": [Function],
                },
                {
                  "id": "/subdir/other",
                  "lazy": [Function],
                  "path": "other",
                },
              ],
              "id": "/subdir/",
              "lazy": [Function],
              "path": "subdir/",
            },
            {
              "children": [
                {
                  "id": "/abc/[dynsub]",
                  "lazy": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "id": "/abc/[dynsub]/new",
                      "lazy": [Function],
                      "path": "new",
                    },
                  ],
                  "id": "/abc/[dynsub]/",
                  "path": ":dynsub/",
                },
              ],
              "id": "/abc/",
              "path": "abc/",
            },
          ],
          "id": "/",
          "lazy": [Function],
          "path": "/",
        },
      ]
    `);

    expect(result.routesMeta).toMatchInlineSnapshot(`
      {
        "/": {
          "entries": [
            {
              "file": "(root)/layout.tsx",
              "isServer": false,
              "mod": [Function],
            },
            {
              "file": "(root)/layout.server.tsx",
              "isServer": true,
              "mod": [Function],
            },
          ],
          "route": {
            "children": [
              {
                "id": "/index",
                "index": true,
                "lazy": [Function],
              },
              {
                "id": "/other",
                "lazy": [Function],
                "path": "other",
              },
              {
                "id": "/[dynamic]",
                "lazy": [Function],
                "path": ":dynamic",
              },
              {
                "children": [
                  {
                    "id": "/subdir/index",
                    "index": true,
                    "lazy": [Function],
                  },
                  {
                    "id": "/subdir/other",
                    "lazy": [Function],
                    "path": "other",
                  },
                ],
                "id": "/subdir/",
                "lazy": [Function],
                "path": "subdir/",
              },
              {
                "children": [
                  {
                    "id": "/abc/[dynsub]",
                    "lazy": [Function],
                    "path": ":dynsub",
                  },
                  {
                    "children": [
                      {
                        "id": "/abc/[dynsub]/new",
                        "lazy": [Function],
                        "path": "new",
                      },
                    ],
                    "id": "/abc/[dynsub]/",
                    "path": ":dynsub/",
                  },
                ],
                "id": "/abc/",
                "path": "abc/",
              },
            ],
            "id": "/",
            "lazy": [Function],
            "path": "/",
          },
        },
        "/[dynamic]": {
          "entries": [
            {
              "file": "(root)/[dynamic].page.ts",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/[dynamic]",
            "lazy": [Function],
            "path": ":dynamic",
          },
        },
        "/abc/": {
          "entries": [],
          "route": {
            "children": [
              {
                "id": "/abc/[dynsub]",
                "lazy": [Function],
                "path": ":dynsub",
              },
              {
                "children": [
                  {
                    "id": "/abc/[dynsub]/new",
                    "lazy": [Function],
                    "path": "new",
                  },
                ],
                "id": "/abc/[dynsub]/",
                "path": ":dynsub/",
              },
            ],
            "id": "/abc/",
            "path": "abc/",
          },
        },
        "/abc/[dynsub]": {
          "entries": [
            {
              "file": "(root)/abc/[dynsub].page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/abc/[dynsub]",
            "lazy": [Function],
            "path": ":dynsub",
          },
        },
        "/abc/[dynsub]/": {
          "entries": [],
          "route": {
            "children": [
              {
                "id": "/abc/[dynsub]/new",
                "lazy": [Function],
                "path": "new",
              },
            ],
            "id": "/abc/[dynsub]/",
            "path": ":dynsub/",
          },
        },
        "/abc/[dynsub]/new": {
          "entries": [
            {
              "file": "(root)/abc/[dynsub]/new.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/abc/[dynsub]/new",
            "lazy": [Function],
            "path": "new",
          },
        },
        "/index": {
          "entries": [
            {
              "file": "(root)/index.page.js",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/index",
            "index": true,
            "lazy": [Function],
          },
        },
        "/other": {
          "entries": [
            {
              "file": "(root)/other.page.jsx",
              "isServer": false,
              "mod": [Function],
            },
            {
              "file": "(root)/other.page.server.jsx",
              "isServer": true,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/other",
            "lazy": [Function],
            "path": "other",
          },
        },
        "/subdir/": {
          "entries": [
            {
              "file": "(root)/subdir/layout.jsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "children": [
              {
                "id": "/subdir/index",
                "index": true,
                "lazy": [Function],
              },
              {
                "id": "/subdir/other",
                "lazy": [Function],
                "path": "other",
              },
            ],
            "id": "/subdir/",
            "lazy": [Function],
            "path": "subdir/",
          },
        },
        "/subdir/index": {
          "entries": [
            {
              "file": "(root)/subdir/index.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/subdir/index",
            "index": true,
            "lazy": [Function],
          },
        },
        "/subdir/other": {
          "entries": [
            {
              "file": "(root)/subdir/other.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
          "route": {
            "id": "/subdir/other",
            "lazy": [Function],
            "path": "other",
          },
        },
      }
    `);

    // walkArrayTree usage example
    const manifest: Record<string, unknown> = {};
    walkArrayTree(result.routes as DataRouteObject[], (route) => {
      manifest[route.id] = objectPick(route, ["path", "index"]);
    });
    expect(manifest).toMatchInlineSnapshot(`
      {
        "/": {
          "path": "/",
        },
        "/[dynamic]": {
          "path": ":dynamic",
        },
        "/abc/": {
          "path": "abc/",
        },
        "/abc/[dynsub]": {
          "path": ":dynsub",
        },
        "/abc/[dynsub]/": {
          "path": ":dynsub/",
        },
        "/abc/[dynsub]/new": {
          "path": "new",
        },
        "/index": {
          "index": true,
        },
        "/other": {
          "path": "other",
        },
        "/subdir/": {
          "path": "subdir/",
        },
        "/subdir/index": {
          "index": true,
        },
        "/subdir/other": {
          "path": "other",
        },
      }
    `);
  });
});

describe(splitPathSegment, () => {
  it("basic", () => {
    expect(splitPathSegment("/")).toMatchInlineSnapshot(`
      [
        "/",
      ]
    `);
    expect(splitPathSegment("/xyz")).toMatchInlineSnapshot(`
      [
        "/",
        "xyz",
      ]
    `);
    expect(splitPathSegment("/abc/def")).toMatchInlineSnapshot(`
      [
        "/",
        "abc/",
        "def",
      ]
    `);
  });
});
