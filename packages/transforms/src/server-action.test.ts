import { dirname } from "path";
import { hashString } from "@hiogawa/utils";
import { mkdir, writeFile } from "fs/promises";
import type MagicString from "magic-string";
import { describe, expect, it } from "vitest";
import { transformServerActionInline } from "./server-action";

// function inlineSourceMap(output: MagicString) {
//   const code = output.toString();
//   const map = output.generateMap({ includeContent: true });
//   const encoded = Buffer.from(JSON.stringify(map), "utf-8").toString("base64");
//   return `${code}\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${encoded}\n`;
// }

describe(transformServerActionInline, () => {
  async function testTransform(input: string) {
    console.log(input);
    // try {
    //   await transformServerActionInline(input, "<id>");
    // } catch (e) {
    //   console.error(e);
    // }
    // const output = await transformServerActionInline(input, "<id>");
    // console.log(output);
    // // if (output && process.env["DEBUG_SOURCEMAP"]) {
    // //   // use it on https://evanw.github.io/source-map-visualization
    // //   const filepath = `dist/debug-sourcemap/${hashString(input)}.js`;
    // //   await mkdir(dirname(filepath), { recursive: true });
    // //   await writeFile(filepath, inlineSourceMap(output));
    // // }
    // return output?.toString();
  }

  it.only("top level", async () => {
    const input = `
async function f() {
  "use server";
}
async function g() {
}
`;
    try {
      expect(await testTransform(input)).toMatchInlineSnapshot(`undefined`);
    } catch (e) {
      console.error(e);
    }
  });

  it("closure", async () => {
    const input = `
let count = 0;

function Counter() {
  const name = "value";

  async function changeCount(formData) {
    "use server";
    count += Number(formData.get(name));
  }

  return "something";
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot();
  });

  it("many", async () => {
    const input = `
let count = 0;

function Counter() {
  const name = "value";

  async function changeCount(formData) {
    "use server";
    count += Number(formData.get(name));
  }

  async function changeCount2(formData) {
    "use server";
    count += Number(formData.get(name));
  }

  return "something";
}

async function changeCount3(formData) {
  "use server";
  count += Number(formData.get(name));
}

`;
    expect(await testTransform(input)).toMatchInlineSnapshot();
  });

  it("arrow", async () => {
    const input = `
let count = 0;

function Counter() {
  const name = "value";

  return {
    type: "form",
    action: (formData) => {
      "use server";
      count += Number(formData.get(name));
    }
  }
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot();
  });
});
