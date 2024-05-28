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
async function f() {
  "use server";
}
async function g() {
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      async function f() {
        "use server";
      }
      async function g() {
      }
      ;
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      f = $$register(f, "<id>", "f");
      export { f };
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


      ;let $$action_0 = async (name, formData) => {
          "use server";
          count += Number(formData.get(name));
        };
      function Counter() {
        const name = "value";

        const changeCount = $$action_0.bind(null, name);

        return "something";
      }
      ;
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


      ;let $$action_0 = async (name, formData) => {
          "use server";
          count += Number(formData.get(name));
        };

      ;let $$action_1 = async (name, formData) => {
          "use server";
          count += Number(formData.get(name));
        };
      function Counter() {
        const name = "value";

        const changeCount = $$action_0.bind(null, name);

        const changeCount2 = $$action_1.bind(null, name);

        return "something";
      }

      async function changeCount3(formData) {
        "use server";
        count += Number(formData.get(name));
      }

      ;
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
      $$action_1 = $$register($$action_1, "<id>", "$$action_1");
      export { $$action_1 };
      changeCount3 = $$register(changeCount3, "<id>", "changeCount3");
      export { changeCount3 };
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


      ;let $$action_0 = (name, formData) => {
            "use server";
            count += Number(formData.get(name));
          };
      function Counter() {
        const name = "value";

        return {
          type: "form",
          action: $$action_0.bind(null, name)
        }
      }
      ;
      import { registerServerReference as $$register } from "/src/features/server-action/server";
      $$action_0 = $$register($$action_0, "<id>", "$$action_0");
      export { $$action_0 };
      "
    `);
  });
});
