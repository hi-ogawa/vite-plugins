import { parseAstAsync } from "vite";
import { describe, expect, test } from "vitest";
import { debugSourceMap } from "./test-utils";
import { transformWrapExport } from "./wrap-export";

async function testTransform(input: string) {
  const ast = await parseAstAsync(input);
  const { output } = transformWrapExport(input, ast, {
    runtime: (value, name) =>
      `$$wrap(${value}, "<id>", ${JSON.stringify(name)})`,
    ignoreExportAllDeclaration: true,
  });
  if (process.env["DEBUG_SOURCEMAP"]) {
    await debugSourceMap(output);
  }
  return output.hasChanged() && output.toString();
}

describe(transformWrapExport, () => {
  test("basic", async () => {
    const input = `
export const Arrow = () => {};
export default "hi";
export function Fn() {};
export async function AsyncFn() {};
export class Cls {};
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let Arrow = () => {};
      const $$default = "hi";
      function Fn() {};
      async function AsyncFn() {};
      class Cls {};
      Arrow = /* #__PURE__ */ $$wrap(Arrow, "<id>", "Arrow");
      export { Arrow };
      Fn = /* #__PURE__ */ $$wrap(Fn, "<id>", "Fn");
      export { Fn };
      AsyncFn = /* #__PURE__ */ $$wrap(AsyncFn, "<id>", "AsyncFn");
      export { AsyncFn };
      Cls = /* #__PURE__ */ $$wrap(Cls, "<id>", "Cls");
      export { Cls };
      ;
      const $$wrap_$$default = /* #__PURE__ */ $$wrap($$default, "<id>", "default");
      export { $$wrap_$$default as default };
      "
    `);
  });

  test("preserve reference", async () => {
    const input = `
export let count = 0;
export function changeCount() {
  count += 1;
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let count = 0;
      function changeCount() {
        count += 1;
      }
      count = /* #__PURE__ */ $$wrap(count, "<id>", "count");
      export { count };
      changeCount = /* #__PURE__ */ $$wrap(changeCount, "<id>", "changeCount");
      export { changeCount };
      "
    `);
  });

  test("export destructuring", async () => {
    const input = `
export const { x, y: [z] } = { x: 0, y: [1] };
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let { x, y: [z] } = { x: 0, y: [1] };
      x = /* #__PURE__ */ $$wrap(x, "<id>", "x");
      export { x };
      z = /* #__PURE__ */ $$wrap(z, "<id>", "z");
      export { z };
      "
    `);
  });

  test("default function", async () => {
    const input = `export default function Fn() {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "function Fn() {};
      const $$wrap_Fn = /* #__PURE__ */ $$wrap(Fn, "<id>", "default");
      export { $$wrap_Fn as default };
      "
    `,
    );
  });

  test("default anonymous function", async () => {
    const input = `export default function () {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "const $$default = function () {};
      const $$wrap_$$default = /* #__PURE__ */ $$wrap($$default, "<id>", "default");
      export { $$wrap_$$default as default };
      "
    `,
    );
  });

  test("default class", async () => {
    const input = `export default class Cls {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "class Cls {};
      const $$wrap_Cls = /* #__PURE__ */ $$wrap(Cls, "<id>", "default");
      export { $$wrap_Cls as default };
      "
    `,
    );
  });

  test("export simple", async () => {
    const input = `
const x = 0;
export { x }
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      const x = 0;

      ;
      const $$wrap_x = /* #__PURE__ */ $$wrap(x, "<id>", "x");
      export { $$wrap_x as x };
      "
    `);
  });

  test("export rename", async () => {
    const input = `
const x = 0;
export { x as y }
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      const x = 0;

      ;
      const $$wrap_x = /* #__PURE__ */ $$wrap(x, "<id>", "y");
      export { $$wrap_x as y };
      "
    `);
  });

  test("re-export simple", async () => {
    const input = `export { x } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      ";
      import { x as $$import_x } from "./dep";
      const $$wrap_$$import_x = /* #__PURE__ */ $$wrap($$import_x, "<id>", "x");
      export { $$wrap_$$import_x as x };
      "
    `);
  });

  test("re-export rename", async () => {
    const input = `export { x as y } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      ";
      import { x as $$import_x } from "./dep";
      const $$wrap_$$import_x = /* #__PURE__ */ $$wrap($$import_x, "<id>", "y");
      export { $$wrap_$$import_x as y };
      "
    `);
  });

  test("re-export all simple", async () => {
    const input = `export * from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`false`);
  });

  test("re-export all rename", async () => {
    const input = `export * as all from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`false`);
  });
});
