import { type SpawnOptions, spawn } from "node:child_process";
import { stripVTControlCharacters, styleText } from "node:util";
import test from "@playwright/test";

export type Fixture = {
  mode?: "dev" | "build";
  root: string;
  url: () => string;
};

function runCli(options: { command: string; label?: string } & SpawnOptions) {
  const [name, ...args] = options.command.split(" ");
  const child = spawn(name!, args, options);
  const label = `[${options.label ?? "cli"}]`;
  child.stdout!.on("data", (data) => {
    if (process.env.TEST_PIPE_STDIN) {
      console.log(styleText("gray", label), data.toString());
    }
  });
  child.stderr!.on("data", (data) => {
    console.log(styleText("red", label), data.toString());
  });
  const done = new Promise<void>((resolve) => {
    child.on("exit", (code) => {
      if (code !== 0) {
        console.log(styleText("red", `${label} exited with code ${code}`));
      }
      resolve();
    });
  });

  async function findPort(): Promise<number> {
    let stdout = "";
    return new Promise((resolve) => {
      child.stdout!.on("data", (data) => {
        stdout += stripVTControlCharacters(String(data));
        const match = stdout.match(/http:\/\/localhost:(\d+)/);
        if (match) {
          resolve(Number(match[1]));
        }
      });
    });
  }

  function kill() {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"]);
    } else {
      child.kill();
    }
  }

  return { proc: child, done, findPort, kill };
}

export function useFixture(options: {
  root: string;
  mode?: "dev" | "build";
}): Fixture {
  let cleanup: (() => Promise<void>) | undefined;
  let baseURL!: string;

  test.beforeAll(async () => {
    if (options.mode === "dev") {
      const proc = runCli({
        command: `pnpm dev`,
        label: `[fixture:dev:${options.root}]`,
        cwd: options.root,
      });
      const port = await proc.findPort();
      // TODO: use `test.extend` to set `baseURL`?
      baseURL = `http://localhost:${port}`;
      cleanup = async () => {
        proc.kill();
        await proc.done;
      };
    }
    if (options.mode === "build") {
      if (!process.env.TEST_SKIP_BUILD) {
        const proc = runCli({
          command: `pnpm build`,
          label: `[fixture:build:${options.root}]`,
          cwd: options.root,
        });
        await proc.done;
      }
      const proc = runCli({
        command: `pnpm preview`,
        label: `[fixture:preview:${options.root}]`,
        cwd: options.root,
      });
      const port = await proc.findPort();
      baseURL = `http://localhost:${port}`;
      cleanup = async () => {
        proc.kill();
        await proc.done;
      };
    }
  });

  test.afterAll(async () => {
    await cleanup?.();
  });

  return {
    mode: options.mode,
    root: options.root,
    url: () => baseURL,
  };
}
