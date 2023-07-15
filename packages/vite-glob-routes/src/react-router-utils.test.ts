import { objectPick } from "@hiogawa/utils";
import type { DataRouteObject } from "react-router";
import { describe, expect, it } from "vitest";
import {
  createGlobPageRoutes,
  splitPathSegment,
  walkArrayTree,
} from "./react-router-utils";

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
              "id": "0-0",
              "index": true,
              "lazy": [Function],
            },
            {
              "id": "0-1",
              "lazy": [Function],
              "path": "other",
            },
            {
              "id": "0-2",
              "lazy": [Function],
              "path": ":dynamic",
            },
            {
              "children": [
                {
                  "id": "0-3-0",
                  "index": true,
                  "lazy": [Function],
                },
                {
                  "id": "0-3-1",
                  "lazy": [Function],
                  "path": "other",
                },
              ],
              "id": "0-3",
              "lazy": [Function],
              "path": "subdir/",
            },
            {
              "children": [
                {
                  "id": "0-4-0",
                  "lazy": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "id": "0-4-1-0",
                      "lazy": [Function],
                      "path": "new",
                    },
                  ],
                  "id": "0-4-1",
                  "path": ":dynsub/",
                },
              ],
              "id": "0-4",
              "path": "abc/",
            },
          ],
          "id": "0",
          "lazy": [Function],
          "path": "/",
        },
      ]
    `);

    expect(result.routesMeta).toMatchInlineSnapshot(`
      {
        "0": {
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
        },
        "0-0": {
          "entries": [
            {
              "file": "(root)/index.page.js",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-1": {
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
        },
        "0-2": {
          "entries": [
            {
              "file": "(root)/[dynamic].page.ts",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-3": {
          "entries": [
            {
              "file": "(root)/subdir/layout.jsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-3-0": {
          "entries": [
            {
              "file": "(root)/subdir/index.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-3-1": {
          "entries": [
            {
              "file": "(root)/subdir/other.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-4": {
          "entries": [],
        },
        "0-4-0": {
          "entries": [
            {
              "file": "(root)/abc/[dynsub].page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
        "0-4-1": {
          "entries": [],
        },
        "0-4-1-0": {
          "entries": [
            {
              "file": "(root)/abc/[dynsub]/new.page.tsx",
              "isServer": false,
              "mod": [Function],
            },
          ],
        },
      }
    `);

    const manifest: Record<string, unknown> = {};
    walkArrayTree(result.routes as DataRouteObject[], (route) => {
      manifest[route.id] = objectPick(route, ["path", "index"]);
    });
    expect(manifest).toMatchInlineSnapshot(`
      {
        "0": {
          "path": "/",
        },
        "0-0": {
          "index": true,
        },
        "0-1": {
          "path": "other",
        },
        "0-2": {
          "path": ":dynamic",
        },
        "0-3": {
          "path": "subdir/",
        },
        "0-3-0": {
          "index": true,
        },
        "0-3-1": {
          "path": "other",
        },
        "0-4": {
          "path": "abc/",
        },
        "0-4-0": {
          "path": ":dynsub",
        },
        "0-4-1": {
          "path": ":dynsub/",
        },
        "0-4-1-0": {
          "path": "new",
        },
      }
    `);
  });
});

describe(splitPathSegment, () => {
  // prettier-ignore
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
  })
});
