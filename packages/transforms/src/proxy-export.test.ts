import { parseAstAsync } from "vite";
import { describe, expect, test } from "vitest";
import { transformProxyExport } from "./proxy-export";
import { debugSourceMap } from "./test-utils";
import { transformWrapExport } from "./wrap-export";

async function testTransform(input: string) {
  const ast = await parseAstAsync(input);
  const result = transformProxyExport(ast, {
    code: input,
    runtime: (name) => `$$proxy("<id>", ${JSON.stringify(name)})`,
  });
  if (process.env["DEBUG_SOURCEMAP"]) {
    await debugSourceMap(result.output);
  }
  return { ...result, output: result.output.toString() };
}

describe(transformWrapExport, () => {
  test("basic", async () => {
    const input = `
export const Arrow = () => {

};
export default "hi";
export function Fn() {
};

export async function AsyncFn() {


};

export class Cls {};
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "Arrow",
          "default",
          "Fn",
          "AsyncFn",
          "Cls",
        ],
        "output": "
      export const Arrow = /* #__PURE__ */ $$proxy("<id>", "Arrow");

      export default /* #__PURE__ */ $$proxy("<id>", "default");

      export const Fn = /* #__PURE__ */ $$proxy("<id>", "Fn");


      export const AsyncFn = /* #__PURE__ */ $$proxy("<id>", "AsyncFn");


      export const Cls = /* #__PURE__ */ $$proxy("<id>", "Cls");

      ",
      }
    `);
  });

  test("export destructuring", async () => {
    const input = `
export const { x, y: [z] } = { x: 0, y: [1] };
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "x",
          "z",
        ],
        "output": "
      export const x = /* #__PURE__ */ $$proxy("<id>", "x");
      export const z = /* #__PURE__ */ $$proxy("<id>", "z");

      ",
      }
    `);
  });

  test("default function", async () => {
    const input = `export default function Fn() {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      {
        "exportNames": [
          "default",
        ],
        "output": "export default /* #__PURE__ */ $$proxy("<id>", "default");
      ",
      }
    `,
    );
  });

  test("default anonymous function", async () => {
    const input = `export default function () {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      {
        "exportNames": [
          "default",
        ],
        "output": "export default /* #__PURE__ */ $$proxy("<id>", "default");
      ",
      }
    `,
    );
  });

  test("default class", async () => {
    const input = `export default class Cls {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      {
        "exportNames": [
          "default",
        ],
        "output": "export default /* #__PURE__ */ $$proxy("<id>", "default");
      ",
      }
    `,
    );
  });

  test("export simple", async () => {
    const input = `
const x = 0;
export { x }
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "x",
        ],
        "output": "

      export const x = /* #__PURE__ */ $$proxy("<id>", "x");

      ",
      }
    `);
  });

  test("export rename", async () => {
    const input = `
const x = 0;
export { x as y }
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "y",
        ],
        "output": "

      export const y = /* #__PURE__ */ $$proxy("<id>", "y");

      ",
      }
    `);
  });

  test("re-export simple", async () => {
    const input = `export { x } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "x",
        ],
        "output": "export const x = /* #__PURE__ */ $$proxy("<id>", "x");
      ",
      }
    `);
  });

  test("re-export rename", async () => {
    const input = `export { x as y } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      {
        "exportNames": [
          "y",
        ],
        "output": "export const y = /* #__PURE__ */ $$proxy("<id>", "y");
      ",
      }
    `);
  });
});
