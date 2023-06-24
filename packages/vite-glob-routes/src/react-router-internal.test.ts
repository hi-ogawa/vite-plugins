import { describe, expect, it } from "vitest";
import {
  createGlobPageRoutes,
  splitPathSegment,
} from "./react-router-internal";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const Page = () => null;
    const Module = { Page };
    const tree = createGlobPageRoutes(
      "(root)",
      {
        "(root)/index.page.js": Module,
        "(root)/other.page.jsx": Module,
        "(root)/[dynamic].page.ts": Module,
        "(root)/subdir/index.page.tsx": Module,
        "(root)/subdir/other.page.tsx": Module,
        "(root)/abc/[dynsub].page.tsx": Module,
        "(root)/abc/[dynsub]/new.page.tsx": Module,
      },
      {
        "(root)/layout.tsx": Module,
        "(root)/subdir/layout.jsx": Module,
      }
    );
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
              "children": [],
              "path": "other",
            },
            {
              "Component": [Function],
              "children": [],
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
                  "children": [],
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
                  "children": [],
                  "path": ":dynsub",
                },
                {
                  "Component": null,
                  "children": [
                    {
                      "Component": [Function],
                      "children": [],
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
