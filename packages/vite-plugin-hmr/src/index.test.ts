import MagicString from "magic-string";
import { parseAstAsync } from "vite";
import { describe, expect, it } from "vitest";
import { hmrTransform } from "./plugin";
import { analyzeExports } from "./transform";

describe(hmrTransform, () => {
  const examples = [
    [
      "basic",
      `
export function Test1() {}

export let Test2 = () => {}

export /*some*/ const /*comment*/ Test3 = () => {}

export default function Test4() {}
`,
    ],
    [
      "unsupported separate named export",
      `
const SomeNamed = () => {};
export { SomeNamed };
`,
    ],
    [
      "unsupported separate default export",
      `
const SomeDeafult = () => {};
export default SomeDefault;
`,
    ],
  ] as const;

  examples.forEach(([title, code], i) => {
    describe(`${i} - ${title}`, () => {
      it(analyzeExports, async () => {
        const ast = await parseAstAsync(code);
        const { exportIds, errors } = analyzeExports(
          new MagicString(code),
          ast as any
        );
        expect({
          exportIds,
          errors: errors.map((e) => code.slice(e.node.start, e.node.end)),
        }).toMatchSnapshot();
      });

      it(hmrTransform, async () => {
        expect(await hmrTransform(code)).toMatchSnapshot();
      });
    });
  });
});
