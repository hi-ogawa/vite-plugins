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
      "separate named export (unsupported)",
      `
const SomeNamed = () => {};
export { SomeNamed };
`,
    ],
    [
      "separate default export (unsupported)",
      `
const SomeDeafult = () => {};
export default SomeDefault;
`,
    ],
    [
      "anonymous default export (unsupported)",
      `
export default () => {};
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
