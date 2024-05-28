import { parseAstAsync } from "vite";
import { describe, expect, test } from "vitest";
import { transformProxyExport } from "./proxy-export";
import { transformWrapExport } from "./wrap-export";

async function testTransform(input: string) {
  const ast = await parseAstAsync(input);
  const output = await transformProxyExport(ast, {
    id: "<id>",
    runtime: "$$proxy",
  });
  return output.toString();
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
      "export const Arrow = $$proxy("<id>", "Arrow");
      export default $$proxy("<id>", "default");
      export const Fn = $$proxy("<id>", "Fn");
      export const AsyncFn = $$proxy("<id>", "AsyncFn");
      export const Cls = $$proxy("<id>", "Cls");
      "
    `);
  });

  test("export destructuring", async () => {
    const input = `
export const { x, y: [z] } = { x: 0, y: [1] };
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "export const x = $$proxy("<id>", "x");
      export const z = $$proxy("<id>", "z");
      "
    `);
  });

  test("default function", async () => {
    const input = `export default function Fn() {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "export default $$proxy("<id>", "default");
      "
    `,
    );
  });

  test("default anonymous function", async () => {
    const input = `export default function () {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "export default $$proxy("<id>", "default");
      "
    `,
    );
  });

  test("default class", async () => {
    const input = `export default class Cls {}`;
    expect(await testTransform(input)).toMatchInlineSnapshot(
      `
      "export default $$proxy("<id>", "default");
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
      "export const x = $$proxy("<id>", "x");
      "
    `);
  });

  test("export rename", async () => {
    const input = `
const x = 0;
export { x as y }
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "export const y = $$proxy("<id>", "y");
      "
    `);
  });

  test("re-export simple", async () => {
    const input = `export { x } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "export const x = $$proxy("<id>", "x");
      "
    `);
  });

  test("re-export rename", async () => {
    const input = `export { x as y } from "./dep"`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "export const y = $$proxy("<id>", "y");
      "
    `);
  });
});
