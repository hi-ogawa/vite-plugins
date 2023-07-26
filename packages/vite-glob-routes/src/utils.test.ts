import { describe, expect, it } from "vitest";
import { createParamMatcher } from "./utils";

describe(createParamMatcher, () => {
  it("basic", () => {
    const matcher = createParamMatcher("/x/[y]/z/[w]/v");
    expect(matcher("/x/a/z/b/v")).toMatchInlineSnapshot(`
      {
        "params": {
          "w": "b",
          "y": "a",
        },
      }
    `);
    expect(matcher("/x/a/z/b/c")).toMatchInlineSnapshot("undefined");
  });

  it("inner-segment", () => {
    const matcher = createParamMatcher("/x/[a]-[b]/[c]-v");
    expect(matcher("/x/1-2/3-v")).toMatchInlineSnapshot(`
      {
        "params": {
          "a": "1",
          "b": "2",
          "c": "3",
        },
      }
    `);
  });

  it("non-dynamic", () => {
    const matcher = createParamMatcher("/x/a-b/c-v");
    expect(matcher("/x/a-b/c-v")).toMatchInlineSnapshot(`
      {
        "params": {},
      }
    `);
    expect(matcher("/x/1-2/3-v")).toMatchInlineSnapshot("undefined");
  });
});
