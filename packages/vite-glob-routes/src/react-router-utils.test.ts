import { describe, expect, it } from "vitest";
import { createGlobPageRoutes, splitPathSegment } from "./react-router-utils";

describe(createGlobPageRoutes, () => {
  it("basic", () => {
    const mod = async () => ({});
    const tree = createGlobPageRoutes(
      {
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
      },
      {}
    );
    expect(tree.routes).toMatchInlineSnapshot(`
      [
        {
          "children": [
            {
              "globInfo": {
                "entries": [
                  {
                    "file": "(root)/index.page.js",
                    "isServer": false,
                    "mod": [Function],
                  },
                ],
              },
              "index": true,
              "lazy": [Function],
            },
            {
              "globInfo": {
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
              "lazy": [Function],
              "path": "other",
            },
            {
              "globInfo": {
                "entries": [
                  {
                    "file": "(root)/[dynamic].page.ts",
                    "isServer": false,
                    "mod": [Function],
                  },
                ],
              },
              "lazy": [Function],
              "path": ":dynamic",
            },
            {
              "children": [
                {
                  "globInfo": {
                    "entries": [
                      {
                        "file": "(root)/subdir/index.page.tsx",
                        "isServer": false,
                        "mod": [Function],
                      },
                    ],
                  },
                  "index": true,
                  "lazy": [Function],
                },
                {
                  "globInfo": {
                    "entries": [
                      {
                        "file": "(root)/subdir/other.page.tsx",
                        "isServer": false,
                        "mod": [Function],
                      },
                    ],
                  },
                  "lazy": [Function],
                  "path": "other",
                },
              ],
              "globInfo": {
                "entries": [
                  {
                    "file": "(root)/subdir/layout.jsx",
                    "isServer": false,
                    "mod": [Function],
                  },
                ],
              },
              "lazy": [Function],
              "path": "subdir/",
            },
            {
              "children": [
                {
                  "globInfo": {
                    "entries": [
                      {
                        "file": "(root)/abc/[dynsub].page.tsx",
                        "isServer": false,
                        "mod": [Function],
                      },
                    ],
                  },
                  "lazy": [Function],
                  "path": ":dynsub",
                },
                {
                  "children": [
                    {
                      "globInfo": {
                        "entries": [
                          {
                            "file": "(root)/abc/[dynsub]/new.page.tsx",
                            "isServer": false,
                            "mod": [Function],
                          },
                        ],
                      },
                      "lazy": [Function],
                      "path": "new",
                    },
                  ],
                  "path": ":dynsub/",
                },
              ],
              "path": "abc/",
            },
          ],
          "globInfo": {
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
