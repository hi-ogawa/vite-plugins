import { parseAstAsync } from "vite";
import { describe, expect, it } from "vitest";
import { transformHoistInlineDirective } from "./hoist";
import { debugSourceMap } from "./test-utils";

describe(transformHoistInlineDirective, () => {
  async function testTransform(input: string) {
    const ast = await parseAstAsync(input);
    const { output } = await transformHoistInlineDirective(input, ast, {
      id: "<id>",
      runtime: "$$register",
      directive: "use server",
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

      const f = $$register($$hoist_0, "<id>", "$$hoist_0");

      async function g() {
      }

      export const h = $$register($$hoist_1, "<id>", "$$hoist_1");

      const w = $$register($$hoist_2, "<id>", "$$hoist_2");
      export default w;

      ;export async function $$hoist_0() {
        "use server";
        return x;
      };

      ;export async function $$hoist_1(formData) {
        "use server";
        return formData.get(x);
      };

      ;export function $$hoist_2() {
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

        const changeCount = $$register($$hoist_0, "<id>", "$$hoist_0").bind(null, name);

        return "something";
      }

      ;export async function $$hoist_0(name, formData) {
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

        const changeCount = $$register($$hoist_0, "<id>", "$$hoist_0").bind(null, name);

        const changeCount2 = $$register($$hoist_1, "<id>", "$$hoist_1").bind(null, name);

        return "something";
      }

      ;export async function $$hoist_0(name, formData) {
          "use server";
          count += Number(formData.get(name));
        };

      ;export async function $$hoist_1(name, formData) {
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
          action: $$register($$hoist_0, "<id>", "$$hoist_0").bind(null, name)
        }
      }

      ;export function $$hoist_0(name, formData) {
            "use server";
            count += Number(formData.get(name));
          };
      "
    `);
  });

  it("higher order", async () => {
    // packages/react-server/examples/next/app/actions/header/page.tsx
    // packages/react-server/examples/next/app/actions/header/validator.ts
    const input = `
export default function Page() {
  const x = 0;
  const action = validator(async (y) => {
    "use server";
    return x + y;
  })
}

function validator(action) {
  return async function (arg) {
    "use server";
    return action(arg);
  };
}
`;
    expect(await testTransform(input)).toMatchInlineSnapshot(`
      "
      export default function Page() {
        const x = 0;
        const action = validator($$register($$hoist_0, "<id>", "$$hoist_0").bind(null, x))
      }

      function validator(action) {
        return $$register($$hoist_1, "<id>", "$$hoist_1").bind(null, action);
      }

      ;export async function $$hoist_0(x, y) {
          "use server";
          return x + y;
        };

      ;export async function $$hoist_1(action, arg) {
          "use server";
          return action(arg);
        };
      "
    `);
  });
});
