import { spawn } from "child_process";
import { createManualPromise } from "@hiogawa/utils";
import { beforeAll, expect, it } from "vitest";
import { createEditor } from "./helper";

beforeAll(() => {
  process.chdir("examples/minimal");
});

async function runBuild() {
  // TODO: exit status?
  const proc = spawn("pnpm", ["build"], {
    stdio: "pipe",
    env: {
      ...process.env,
      NODE_ENV: undefined,
    },
  });

  let stdout = "";
  let stderr = "";
  proc.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  proc.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  const codePromise = createManualPromise<number>();

  proc.once("close", (code) => {
    console.log({ stderr, stdout, code });
    if (code === null) {
      codePromise.reject(new Error("exit null"));
    } else {
      codePromise.resolve(code);
    }
  });

  proc.once("error", (error) => {
    codePromise.reject(error);
  });

  return {
    wait: () => codePromise,
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

it("server only - success", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const result = await runBuild();
  expect(await result.wait()).toBe(0);
  expect(result.stderr()).not.toContain(
    `'server-only' is included in client build `,
  );
});

it("server only - error", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "server-only"`);

  const result = await runBuild();
  expect(await result.wait()).toBe(0); // TODO: why status zero?
  expect(result.stderr()).toContain(
    `'server-only' is included in client build `,
  );
});

it.skip("client only - success", async () => {
  using file = createEditor("app/_client.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const output = await runBuild();
  expect(output.stderr).not.toContain(
    `'client-only' is included in server build `,
  );
});

it.skip("client only - error", async () => {
  using file = createEditor("app/_action.tsx");
  file.edit((s) => s + `\n\n;import "client-only"`);

  const output = await runBuild();
  expect(output.stderr).toContain(`'client-only' is included in server build `);
});
