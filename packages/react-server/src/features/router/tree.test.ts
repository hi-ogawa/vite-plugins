import { describe, expect, it } from "vitest";
import { createFsRouteTree, matchRouteTree } from "./tree";

describe(createFsRouteTree, () => {
  it("basic", async () => {
    const files = [
      "/layout.tsx",
      "/page.tsx",
      "/other/page.tsx",
      "/test/layout.tsx",
      "/test/page.tsx",
      "/test/other/page.tsx",
      "/test/[dynamic]/page.tsx",
      "/test/[dynamic]/hello/page.tsx",
      "/demo/layout.tsx",
      "/demo/page.tsx",
    ];
    const input = Object.fromEntries(files.map((k) => [k, k]));
    const tree = createFsRouteTree(input);
    expect(tree).toMatchSnapshot();

    function testMatch(pathname: string) {
      const match = matchRouteTree(tree, pathname);
      return {
        __pathname: pathname,
        ...match,
      };
    }

    const testCases = [
      "/",
      "/other",
      "/not-found",
      "/test",
      "/test/other",
      "/test/not-found",
    ];
    for (const e of testCases) {
      expect(testMatch(e)).matchSnapshot();
    }
  });
});
