import { describe, expect, it } from "vitest";
import type { AnyRouteModule } from "./server";
import {
  createFsRouteTree,
  matchRouteTree,
  matchRouteTree2,
  withMatchRouteId,
} from "./tree";

describe(createFsRouteTree, () => {
  it("basic", async () => {
    const files = [
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
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const result = matchRouteTree(tree, pathname);
      return {
        __pathname: pathname,
        matches: result.matches.map((m) => ({
          ...m,
          node: m.node.value,
        })),
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
    ];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });
});

describe(matchRouteTree2, () => {
  it("basic", async () => {
    const files = ["/page.js", "/a/page.js"];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const matches = matchRouteTree2(tree, pathname, "page");
      return {
        _pathname: pathname,
        matches: matches?.map((m) => ({
          ...m,
          node: !!m.node.value,
        })),
      };
    }

    const testCases = ["/", "/a", "/b"];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });

  it("dynamic not-found", async () => {
    const files = [
      "/a/b/c/page.js",
      "/a/not-found.js",
      "/[x]/b/d/page.js",
      "/[x]/not-found.js",
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const matches = matchRouteTree2(tree, pathname, "page");
      return {
        _pathname: pathname,
        matches: matches?.map((m) => ({
          ...m,
          node: m.node.value,
        })),
      };
    }

    const testCases = [
      "/a/b/c",
      "/a/b/d", // -> /a/not-found.js
      "/x/b/e", // -> /[x]/not-found.js
    ];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });

  it("group routes basic", async () => {
    const files = [
      "/a/page.js",
      "/(x)/b/page.js",
      "/c/(x)/page.js",
      "/(x)/d/(y)/page.js",
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const matches = matchRouteTree2(tree, pathname, "page");
      return {
        _pathname: pathname,
        matches: matches?.map((m) => ({
          ...m,
          node: m.node.value,
        })),
      };
    }

    const testCases = ["/a", "/b", "/c", "/d"];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });

  it("group routes not-found", async () => {
    const files = [
      "/a/b/page.js",
      "/a/not-found.js",
      "/(x)/a/c/page.js",
      "/(x)/a/c/not-found.js",
      "/(x)/a/not-found.js",
      "/(x)/p/q/page.js",
      "/(x)/p/not-found.js",
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const { tree } = createFsRouteTree<AnyRouteModule>(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const matches = matchRouteTree2(tree, pathname, "page");
      return {
        _pathname: pathname,
        matches: matches?.map((m) => ({
          ...m,
          node: m.node.value,
        })),
      };
    }

    const testCases = [
      "/a/u",
      // TODO
      // maybe this should trigger /(x)/a/c/not-found.js
      // but Next.js doesn't seem to do it
      "/a/c/u",
      "/p/u",
    ];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });

  // TODO: include this above
  describe(withMatchRouteId, () => {
    it("basic", () => {
      const files = [
        "/page.js",
        "/a/page.js",
        "/a/b/page.js",
        "/a/not-found.js",
      ];
      const input = Object.fromEntries(files.map((k) => [k, k]));
      const { tree } = createFsRouteTree<AnyRouteModule>(input);
      expect(tree).toMatchSnapshot();

      function testMatch(pathname: string) {
        const matches = matchRouteTree2(tree, pathname, "page");
        const matches3 = withMatchRouteId(matches ?? []);
        return {
          _pathname: pathname,
          matches: matches3.map((m) => ({
            ...m,
            node: "_",
          })),
        };
      }

      const testCases = ["/", "/a", "/a/b", "/a/b/c"];
      for (const e of testCases) {
        expect(testMatch(e)).matchSnapshot();
      }
    });

    it("group routes", () => {
      const files = [
        "/a/page.js",
        "/(x)/b/page.js",
        "/c/(x)/page.js",
        "/(y)/d/(z)/page.js",
      ];
      const input = Object.fromEntries(files.map((k) => [k, k]));
      const { tree } = createFsRouteTree<AnyRouteModule>(input);
      expect(tree).toMatchSnapshot();

      function testMatch(pathname: string) {
        const matches = matchRouteTree2(tree, pathname, "page");
        const matches3 = withMatchRouteId(matches ?? []);
        return {
          _pathname: pathname,
          matches: matches3.map((m) => ({
            ...m,
            node: "_",
          })),
        };
      }

      const testCases = ["/a", "/b", "/c", "/d"];
      for (const e of testCases) {
        expect(testMatch(e)).matchSnapshot();
      }
    });
  });
});
