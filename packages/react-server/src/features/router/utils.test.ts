import { describe, expect, it } from "vitest";
import { isAncestorPath } from "./utils";

describe(isAncestorPath, () => {
  it("basic", () => {
    expect(isAncestorPath("/x", "/x")).toMatchInlineSnapshot(`true`);
    expect(isAncestorPath("/x", "/x/y")).toMatchInlineSnapshot(`true`);
    expect(isAncestorPath("/x", "/xx/y")).toMatchInlineSnapshot(`false`);
  });
});
