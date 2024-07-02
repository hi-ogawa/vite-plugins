import { exec } from "child_process";
import { promisify } from "util";
import { beforeAll, expect, it } from "vitest";
import { createEditor } from "./helper";

beforeAll(() => {
  process.chdir("examples/minimal");
});

async function runBuild() {
  // TODO: exit status?
  const output = await promisify(exec)("pnpm build", {
    env: {
      ...process.env,
      NODE_ENV: undefined,
    },
  });
  return output;
}

it("server only - success", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const output = await runBuild();
  expect(output.stderr).not.toContain(
    `'server-only' is included in client build `,
  );
});

it("server only - error", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const output = await runBuild();
  expect(output.stderr).toContain(`'server-only' is included in client build `);
});

it("client only - success", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const output = await runBuild();
  expect(output.stderr).not.toContain(
    `'client-only' is included in server build `,
  );
});

it("client only - error", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const output = await runBuild();
  expect(output.stderr).toContain(`'client-only' is included in server build `);
});
