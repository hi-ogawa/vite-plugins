import { describe, expect, it } from "vitest";
import {
  type PageModule,
  createGlobPageRoutes,
  splitPathSegment,
} from "./react-router-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const Module: PageModule = { Component: () => null };
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
        "(root)/other.page.server.jsx": { loader: () => null },
      },
      globLayout: {
        "(root)/layout.tsx": Module,
        "(root)/subdir/layout.jsx": Module,
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
              "Component": null,
              "children": [
                {
                  "Component": [Function],
                  "path": ":dynsub",
                },
                {
                  "Component": null,
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
