import { describe, expect, it } from "vitest";
import { hmrTransform } from "./plugin";

describe(hmrTransform, () => {
  const examples = [
    [
      "basic 1",
      `
export function Test1() {
  return <div>hello</div>;
}

export let Test2 = () => {
  return <div>hello</div>;
}
`,
    ],
  ] as const;

  for (const [title, code] of examples) {
    it(title, () => {
      expect(hmrTransform(code, "id")).toMatchSnapshot();
    });
  }
});
