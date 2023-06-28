import { describe, expect, it } from "vitest";
import {
  type LazyPageModule,
  createGlobPageRoutes,
  splitPathSegment,
} from "./react-router-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const mod: LazyPageModule = async () => ({});
    const tree = createGlobPageRoutes({
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
    expect(tree.routes).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "index": true,
              "lazy": [Function],
            },
            {
              "lazy": [Function],
              "path": "other",
            },
            {
              "lazy": [Function],
              "path": ":dynamic",
            },
            {
              "children": [
                {
                  "index": true,
                  "lazy": [Function],
                },
                {
                  "lazy": [Function],
                  "path": "other",
                },
              ],
              "lazy": [Function],
              "path": "subdir/",
            },
            {
              "children": [
                {
                  "lazy": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "lazy": [Function],
                      "path": "new",
                    },
                  ],
                  "lazy": undefined,
                  "path": ":dynsub/",
                },
              ],
              "lazy": undefined,
              "path": "abc/",
            },
          ],
          "lazy": [Function],
          "path": "/",
        },
      ]
    `);
    expect(tree.mapping).toMatchInlineSnapshot(`
      {
        "/": [
          {
            "file": "(root)/layout.tsx",
            "mod": [Function],
          },
          {
            "file": "(root)/layout.server.tsx",
            "mod": [Function],
          },
        ],
        "/[dynamic]": [
          {
            "file": "(root)/[dynamic].page.ts",
            "mod": [Function],
          },
        ],
        "/abc/[dynsub]": [
          {
            "file": "(root)/abc/[dynsub].page.tsx",
            "mod": [Function],
          },
        ],
        "/abc/[dynsub]/new": [
          {
            "file": "(root)/abc/[dynsub]/new.page.tsx",
            "mod": [Function],
          },
        ],
        "/index": [
          {
            "file": "(root)/index.page.js",
            "mod": [Function],
          },
        ],
        "/other": [
          {
            "file": "(root)/other.page.jsx",
            "mod": [Function],
          },
          {
            "file": "(root)/other.page.server.jsx",
            "mod": [Function],
          },
        ],
        "/subdir/": [
          {
            "file": "(root)/subdir/layout.jsx",
            "mod": [Function],
          },
        ],
        "/subdir/index": [
          {
            "file": "(root)/subdir/index.page.tsx",
            "mod": [Function],
          },
        ],
        "/subdir/other": [
          {
            "file": "(root)/subdir/other.page.tsx",
            "mod": [Function],
          },
        ],
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
