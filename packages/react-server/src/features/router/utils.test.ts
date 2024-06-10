import { describe, expect, it } from "vitest";
import {
  createLayoutContentRequest,
  getNewLayoutContentKeys,
  getPathPrefixes,
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

describe(getNewLayoutContentKeys, () => {
  it("basic", () => {
    expect(getNewLayoutContentKeys("/", "/")).toMatchInlineSnapshot(`
      [
        "/",
      ]
    `);
    expect(getNewLayoutContentKeys("/", "/a")).toMatchInlineSnapshot(`
      [
        "/",
        "/a",
      ]
    `);
    expect(getNewLayoutContentKeys("/a", "/")).toMatchInlineSnapshot(`
      [
        "/",
      ]
    `);
    expect(getNewLayoutContentKeys("/a", "/b")).toMatchInlineSnapshot(`
      [
        "/",
        "/b",
      ]
    `);
    expect(getNewLayoutContentKeys("/a/b", "/a/b")).toMatchInlineSnapshot(`
      [
        "/a/b",
      ]
    `);
    expect(getNewLayoutContentKeys("/a/b", "/a/c")).toMatchInlineSnapshot(`
      [
        "/a",
        "/a/c",
      ]
    `);
    expect(getNewLayoutContentKeys("/a", "/a/b")).toMatchInlineSnapshot(`
      [
        "/a",
        "/a/b",
      ]
    `);
    expect(getNewLayoutContentKeys("/", "/a/b")).toMatchInlineSnapshot(`
      [
        "/",
        "/a",
        "/a/b",
      ]
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
