import { describe, expect, it } from "vitest";
import {
  type LazyPageModule,
  createGlobPageRoutes,
  splitPathSegment,
} from "./react-router-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const Module: LazyPageModule = async () => ({ Component: () => null });
    const tree = createGlobPageRoutes({
      root: "(root)",
      globPage: {
        "(root)/index.page.js": Module,
        "(root)/other.page.jsx": Module,
        "(root)/[dynamic].page.ts": Module,
        "(root)/subdir/index.page.tsx": Module,
        "(root)/subdir/other.page.tsx": Module,
        "(root)/abc/[dynsub].page.tsx": Module,
        "(root)/abc/[dynsub]/new.page.tsx": Module,
      },
      globPageServer: {
        "(root)/other.page.server.jsx": async () => ({ loader: () => null }),
      },
      globLayout: {
        "(root)/layout.tsx": Module,
        "(root)/subdir/layout.jsx": Module,
      },
      globLayoutServer: {},
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
              "children": [],
              "lazy": [Function],
              "path": "other",
            },
            {
              "children": [],
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
                  "children": [],
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
                  "children": [],
                  "lazy": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "children": [],
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
            "filepath": "(root)/layout.tsx",
            "lazy": [Function],
          },
        ],
        "/[dynamic]": [
          {
            "filepath": "(root)/[dynamic].page.ts",
            "lazy": [Function],
          },
        ],
        "/abc/[dynsub]": [
          {
            "filepath": "(root)/abc/[dynsub].page.tsx",
            "lazy": [Function],
          },
        ],
        "/abc/[dynsub]/new": [
          {
            "filepath": "(root)/abc/[dynsub]/new.page.tsx",
            "lazy": [Function],
          },
        ],
        "/index": [
          {
            "filepath": "(root)/index.page.js",
            "lazy": [Function],
          },
        ],
        "/other": [
          {
            "filepath": "(root)/other.page.jsx",
            "lazy": [Function],
          },
          {
            "filepath": "(root)/other.page.server.jsx",
            "lazy": [Function],
          },
        ],
        "/subdir/": [
          {
            "filepath": "(root)/subdir/layout.jsx",
            "lazy": [Function],
          },
        ],
        "/subdir/index": [
          {
            "filepath": "(root)/subdir/index.page.tsx",
            "lazy": [Function],
          },
        ],
        "/subdir/other": [
          {
            "filepath": "(root)/subdir/other.page.tsx",
            "lazy": [Function],
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
