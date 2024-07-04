import { describe, expect, it } from "vitest";
import { getPathPrefixes, isAncestorPath } from "./utils";

describe(getPathPrefixes, () => {
  it("basic", () => {
    expect(getPathPrefixes("/")).toMatchInlineSnapshot(`
      [
        "/",
      ]
    `);
    expect(getPathPrefixes("/hello")).toMatchInlineSnapshot(`
      [
        "/",
        "/hello",
      ]
    `);
    expect(getPathPrefixes("/hello/world")).toMatchInlineSnapshot(`
      [
        "/",
        "/hello",
        "/hello/world",
      ]
    `);
  });
});

describe(isAncestorPath, () => {
  it("basic", () => {
    expect(isAncestorPath("/x", "/x")).toMatchInlineSnapshot(`true`);
    expect(isAncestorPath("/x", "/x/y")).toMatchInlineSnapshot(`true`);
    expect(isAncestorPath("/x", "/xx/y")).toMatchInlineSnapshot(`false`);
  });
});
