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
    expect(tree).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "children": [],
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
                  "children": [],
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
