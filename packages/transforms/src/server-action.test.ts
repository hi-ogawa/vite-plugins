import { describe, expect, it } from "vitest";
import { transformServerActionInline } from "./server-action";
import { debugSourceMap } from "./test-utils";

describe(transformServerActionInline, () => {
  async function testTransform(input: string) {
    const output = await transformServerActionInline(input, "<id>");
    if (output && process.env["DEBUG_SOURCEMAP"]) {
      await debugSourceMap(output);
    }
    return output?.toString();
  }

  it("top level", async () => {
    const input = `
const x = "x";

async function f() {
  "use server";
  return x;
}

async function g() {
}

async function h(formData) {
  "use server";
  return formData.get(x);
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      const x = "x";

      const f = $$register($$action_0, "<id>", "$$action_0");

      async function g() {
      }

      const h = $$register($$action_1, "<id>", "$$action_1");

      ;export async function $$action_0() {
        "use server";
        return x;
      }
      ;export async function $$action_1(formData) {
        "use server";
        return formData.get(x);
      };
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
      $$action_1 = $$register($$action_1, "<id>", "$$action_1");
      export { $$action_1 };
      "
    `);

    // const f = $$register($$action_0, "<id>", "$$action_0").bind(null);

    // export function $$action_0() {}
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
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
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

async function changeCount3(formData) {
  "use server";
  count += Number(formData.get(name));
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

      const changeCount3 = $$register($$action_2, "<id>", "$$action_2");


      ;export async function $$action_0(name, formData) {
          "use server";
          count += Number(formData.get(name));
        }
      ;export async function $$action_1(name, formData) {
          "use server";
          count += Number(formData.get(name));
        }
      ;export async function $$action_2(formData) {
        "use server";
        count += Number(formData.get(name));
      };
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
      $$action_1 = $$register($$action_1, "<id>", "$$action_1");
      export { $$action_1 };
      $$action_2 = $$register($$action_2, "<id>", "$$action_2");
      export { $$action_2 };
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
          action: $$action_0.bind(null, name)
        }
      }

      ;let $$action_0 = (name, formData) => {
            "use server";
            count += Number(formData.get(name));
          };
      ;
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
      "
    `);
  });
});
