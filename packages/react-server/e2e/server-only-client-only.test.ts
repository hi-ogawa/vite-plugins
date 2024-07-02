import { exec } from "child_process";
import { promisify } from "util";
import { beforeAll, describe, it } from "vitest";

beforeAll(() => {
  process.chdir("examples/minimal");
});

const $ = promisify(exec);

describe("server only", () => {
  it("success", async () => {
    await $("pnpm build");
  });

  it("error", async () => {
    await $("pnpm build");
  });
});

describe("client only", () => {
  it("success", async () => {
    await $("pnpm build");
  });

  it("error", async () => {
    await $("pnpm build");
  });
});
