import { describe, expect, it } from "vitest";
import {
  createLayoutContentRequest,
  getPathPrefixes,
  isAncestorPath,
  revalidateLayoutContentRequest,
} from "./utils";

describe(createLayoutContentRequest, () => {
  it("basic", () => {
    expect(createLayoutContentRequest("/")).toMatchInlineSnapshot(`
      {
        "/": {
          "name": "/",
          "type": "page",
        },
        "__root": {
          "name": "/",
          "type": "layout",
        },
      }
    `);
    expect(createLayoutContentRequest("/a")).toMatchInlineSnapshot(`
      {
        "/": {
          "name": "/a",
          "type": "layout",
        },
        "/a": {
          "name": "/a",
          "type": "page",
        },
        "__root": {
          "name": "/",
          "type": "layout",
        },
      }
    `);
    expect(createLayoutContentRequest("/a/b")).toMatchInlineSnapshot(`
      {
        "/": {
          "name": "/a",
          "type": "layout",
        },
        "/a": {
          "name": "/a/b",
          "type": "layout",
        },
        "/a/b": {
          "name": "/a/b",
          "type": "page",
        },
        "__root": {
          "name": "/",
          "type": "layout",
        },
      }
    `);
  });
});

describe(revalidateLayoutContentRequest, () => {
  it("basic", () => {
    expect(
      revalidateLayoutContentRequest("/dir/x", "/dir/y", []),
    ).toMatchInlineSnapshot(`
      {
        "/dir": {
          "name": "/dir/x",
          "type": "layout",
        },
        "/dir/x": {
          "name": "/dir/x",
          "type": "page",
        },
      }
    `);
    expect(
      revalidateLayoutContentRequest("/dir/x", "/dir/y", ["/dir"]),
    ).toMatchInlineSnapshot(`
      {
        "/": {
          "name": "/dir",
          "type": "layout",
        },
        "/dir": {
          "name": "/dir/x",
          "type": "layout",
        },
        "/dir/x": {
          "name": "/dir/x",
          "type": "page",
        },
      }
    `);
  });
});

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
