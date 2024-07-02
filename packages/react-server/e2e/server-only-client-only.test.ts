import { beforeAll, describe, it } from "vitest";
import { createEditor } from "./helper";
import { $ } from "@hiogawa/utils-node";

beforeAll(() => {
  process.chdir("examples/minimal");
});

describe("server only", () => {
  it("success", async () => {
    using file = createEditor("app/_action.tsx");
    file.edit((s) => s + `\n\n;import "server-only"`);
    await $`pnpm build`;
  });

  it.only("error", async () => {
    using file = createEditor("app/_client.tsx");
    file.edit((s) => s + `\n\n;import "server-only"`);
    const output = await $`pnpm build`;
    console.log(output);
  });
});

describe("client only", () => {
  it("success", async () => {
    await $`pnpm build`;
  });

  it("error", async () => {
    await $`pnpm build`;
  });
});
