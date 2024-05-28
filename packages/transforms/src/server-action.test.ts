import { describe, expect, it } from "vitest";
import { transformServerActionInline } from "./server-action";
import { debugSourceMap } from "./test-utils";

describe(transformServerActionInline, () => {
  async function testTransform(input: string) {
    const { output } = await transformServerActionInline(input, {
      id: "<id>",
      runtime: "$$register",
    });
    if (!output.hasChanged()) {
      return;
    }
    if (process.env["DEBUG_SOURCEMAP"]) {
      await debugSourceMap(output);
    }
    return output.toString();
  }

  it("none", async () => {
    const input = `
const x = "x";

async function f() {
  return x;
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`undefined`);
  });

  it("top level", async () => {
    const input = `
const x = "x";

async function f() {
  "use server";
  return x;
}

async function g() {
}

export async function h(formData) {
  "use server";
  return formData.get(x);
}

export default function w() {
  "use server";
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      const x = "x";

      const f = $$register($$action_0, "<id>", "$$action_0");

      async function g() {
      }

      export const h = $$register($$action_1, "<id>", "$$action_1");

      const w = $$register($$action_2, "<id>", "$$action_2");
      export default w;

      ;export async function $$action_0() {
        "use server";
        return x;
      };

      ;export async function $$action_1(formData) {
        "use server";
        return formData.get(x);
      };

      ;export function $$action_2() {
        "use server";
      };
      "
    `);
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
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let count = 0;

      function Counter() {
        const name = "value";

        const changeCount = $$register($$action_0, "<id>", "$$action_0").bind(null, name);

        return "something";
      }

      ;export async function $$action_0(name, formData) {
          "use server";
          count += Number(formData.get(name));
        };
      "
    `);
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
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let count = 0;

      function Counter() {
        const name = "value";

        const changeCount = $$register($$action_0, "<id>", "$$action_0").bind(null, name);

        const changeCount2 = $$register($$action_1, "<id>", "$$action_1").bind(null, name);

        return "something";
      }

      ;export async function $$action_0(name, formData) {
          "use server";
          count += Number(formData.get(name));
        };

      ;export async function $$action_1(name, formData) {
          "use server";
          count += Number(formData.get(name));
        };
      "
    `);
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
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      let count = 0;

      function Counter() {
        const name = "value";

        return {
          type: "form",
          action: $$register($$action_0, "<id>", "$$action_0").bind(null, name)
        }
      }

      ;export function $$action_0(name, formData) {
            "use server";
            count += Number(formData.get(name));
          };
      "
    `);
  });
});
