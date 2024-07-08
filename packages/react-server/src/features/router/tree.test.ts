import { describe, expect, it } from "vitest";
import type { AnyRouteModule } from "./server";
import {
  createFsRouteTree,
  matchPageRoute,
  matchRouteTree,
  parseRoutePath,
} from "./tree";

describe(createFsRouteTree, () => {
  it("basic", async () => {
    const files = [
      "/not-found.js",
      "/layout.tsx",
      "/page.tsx",
      "/other/page.tsx",
      "/test/layout.tsx",
      "/test/page.tsx",
      "/test/other/page.tsx",
      "/dynamic/page.tsx",
      "/dynamic/layout.tsx",
      "/dynamic/static/page.tsx",
      "/dynamic/[id]/page.tsx",
      "/dynamic/[id]/layout.tsx",
      "/dynamic/[id]/[nested]/page.tsx",
      "/dynamic/catchall/page.tsx",
      "/dynamic/catchall/static/page.tsx",
      "/dynamic/catchall/[...any]/page.tsx",
      "/group/a/page.js",
      "/group/(x)/b/page.js",
      "/group/c/(y)/page.js",
      "/group/(z)/d/(w)/page.js",
      "/group/not-found.js",
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const result = matchPageRoute(tree, pathname);
      for (const m of result.matches) m.node = {};
      return {
        __pathname: pathname,
        ...result,
      };
    }

    const testCases = [
      "/",
      "/other",
      "/not-found",
      "/test",
      "/test/other",
      "/test/not-found",
      "/dynamic",
      "/dynamic/static",
      "/dynamic/abc",
      "/dynamic/abc/def",
      "/dynamic/%E2%9C%85",
      "/dynamic/catchall",
      "/dynamic/catchall/static",
      "/dynamic/catchall/x",
      "/dynamic/catchall/x/y",
      "/dynamic/catchall/x/y/z",
      "/group/a",
      "/group/b",
      "/group/c",
      "/group/d",
      "/group/e",
    ];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });
});

describe(matchRouteTree, () => {
  function createMatchTester(files: string[]) {
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);

    function match(pathname: string) {
      const matches = matchRouteTree(tree, pathname, "page");
      for (const m of matches ?? []) m.node = {};
      return {
        __pathname: pathname,
        matches,
      };
    }

    return { tree, match };
  }

  it("basic", async () => {
    const tester = createMatchTester(["/page.js", "/a/page.js"]);
    expect(tester.tree).toMatchSnapshot();

    const testCases = ["/", "/a", "/b"];
    for (const e of testCases) {
      expect(tester.match(e)).matchSnapshot();
    }
  });

  it("dynamic not-found", async () => {
    const tester = createMatchTester([
      "/a/b/c/page.js",
      "/a/not-found.js",
      "/[x]/b/d/page.js",
      "/[x]/not-found.js",
    ]);
    expect(tester.tree).toMatchSnapshot();

    const testCases = [
      "/a/b/c",
      "/a/b/d", // -> /a/not-found.js
      "/x/b/e", // -> /[x]/not-found.js
    ];
    for (const e of testCases) {
      expect(tester.match(e)).matchSnapshot();
    }
  });

  it("group routes basic", async () => {
    const tester = createMatchTester([
      "/a/page.js",
      "/(x)/b/page.js",
      "/c/(x)/page.js",
      "/(x)/d/(y)/page.js",
    ]);
    expect(tester.tree).toMatchSnapshot();

    const testCases = ["/a", "/b", "/c", "/d"];
    for (const e of testCases) {
      expect(tester.match(e)).matchSnapshot();
    }
  });

  it("group routes not-found", async () => {
    const tester = createMatchTester([
      "/a/b/page.js",
      "/a/not-found.js",
      "/(x)/a/c/page.js",
      "/(x)/a/c/not-found.js",
      "/(x)/a/not-found.js",
      "/(x)/p/q/page.js",
      "/(x)/p/not-found.js",
    ]);
    expect(tester.tree).toMatchSnapshot();

    const testCases = [
      "/a/u",
      // TODO
      // maybe this should trigger /(x)/a/c/not-found.js
      // but Next.js doesn't seem to do it
      "/a/c/u",
      "/p/u",
    ];
    for (const e of testCases) {
      expect(tester.match(e)).matchSnapshot();
    }
  });
});

describe(parseRoutePath, () => {
  it("basic", () => {
    const result = parseRoutePath("/a/b/c");
    expect(result).toMatchInlineSnapshot(`
      {
        "dynamic": false,
        "format": [Function],
      }
    `);
    expect(result.format({})).toMatchInlineSnapshot(`"/a/b/c"`);
    expect(() => result.format({ k: "v" })).toThrow();
  });

  it("dynamic", () => {
    const result = parseRoutePath("/a/[b]/c");
    expect(result).toMatchInlineSnapshot(`
      {
        "dynamic": true,
        "format": [Function],
      }
    `);
    expect(result.format({ b: "hello" })).toMatchInlineSnapshot(`"/a/hello/c"`);
    expect(() => result.format({})).toThrow();
  });

  it("group", () => {
    const result = parseRoutePath("/a/(b)/c");
    expect(result).toMatchInlineSnapshot(`
      {
        "dynamic": false,
        "format": [Function],
      }
    `);
    expect(result.format({})).toMatchInlineSnapshot(`"/a/c"`);
    expect(() => result.format({ k: "v" })).toThrow();
  });
});
