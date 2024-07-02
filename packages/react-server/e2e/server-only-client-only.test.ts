import { beforeAll, expect, it } from "vitest";
import { createEditor, runCommand } from "./helper";

beforeAll(() => {
  process.chdir("examples/minimal");
});

it("server only - success", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const result = await runCommand("pnpm", "build");
  expect(result.code).toBe(0);
});

it("server only - error", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const result = await runCommand("pnpm", "build");
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(`'server-only' is included in client build `);
});

it("client only - success", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const result = await runCommand("pnpm", "build");
  expect(result.code).toBe(0);
});

it("client only - error", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const result = await runCommand("pnpm", "build");
  expect(result.code).toBe(1);
  expect(result.stderr).toContain(`'client-only' is included in server build `);
});
