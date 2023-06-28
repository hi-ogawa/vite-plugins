import { describe, expect, it } from "vitest";
import {
  type PageModule,
  createGlobPageRoutes,
  splitPathSegment,
} from "./react-router-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const Module: PageModule = { Component: () => null };
    const Module2: PageModule = { loader: () => null };
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
        "(root)/other.page.server.jsx": Module2,
      },
      globLayout: {
        "(root)/layout.tsx": Module,
        "(root)/subdir/layout.jsx": Module,
      },
      globLayoutServer: {
        "(root)/layout.server.tsx": Module2,
      },
    });
    expect(tree).toMatchInlineSnapshot(`
      [
        {
          "Component": [Function],
          "children": [
            {
              "Component": [Function],
              "index": true,
            },
            {
              "Component": [Function],
              "loader": [Function],
              "path": "other",
            },
            {
              "Component": [Function],
              "path": ":dynamic",
            },
            {
              "Component": [Function],
              "children": [
                {
                  "Component": [Function],
                  "index": true,
                },
                {
                  "Component": [Function],
                  "path": "other",
                },
              ],
              "path": "subdir/",
            },
            {
              "children": [
                {
                  "Component": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "Component": [Function],
                      "path": "new",
                    },
                  ],
                  "path": ":dynsub/",
                },
              ],
              "path": "abc/",
            },
          ],
          "loader": [Function],
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
