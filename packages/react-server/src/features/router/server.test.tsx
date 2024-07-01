import { describe, expect, it } from "vitest";
import { generateRouteModuleTree, renderRouteMap } from "./server";

describe(generateRouteModuleTree, () => {
  it("basic", async () => {
    const files = [
      "/layout.tsx",
      "/page.tsx",
      "/x/page.tsx",
      "/x/error.tsx",
      "/x/y/layout.tsx",
      "/x/y/page.tsx",
    ];
    const input = Object.fromEntries(
      files.map((k) => [k, { default: k.toUpperCase() }]),
    );
    const { tree } = generateRouteModuleTree(input);
    expect(tree).toMatchSnapshot();

    async function testMatch(pathname: string) {
      const match = await renderRouteMap(tree, {
        url: "https://test.local" + pathname,
        headers: new Headers(),
      });
      return {
        // inject pathname for the ease of reading snapshot
        __pathname: pathname,
        ...match,
      };
    }

    expect(await testMatch("/x")).matchSnapshot();
    expect(await testMatch("/x/y")).matchSnapshot();
    expect(await testMatch("/z")).matchSnapshot();
  });
});
