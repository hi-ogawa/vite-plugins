import type { SpawnOptions } from "node:child_process";
import { stripVTControlCharacters, styleText } from "node:util";
import test from "@playwright/test";
import { x } from "tinyexec";

// TODO: refactor

export type Fixture = {
  mode?: "dev" | "build";
  root: string;
  url: () => string;
};

function runCli(options: { command: string; label?: string } & SpawnOptions) {
  const [name, ...args] = options.command.split(" ");
  const proc = x(name!, args, { nodeOptions: options });
  if (process.env.TEST_PIPE_STDIN) {
    proc.process!.stdout!.on("data", (data) => {
      console.log(styleText("gray", options.label ?? "[cli]"), data.toString());
    });
  }
  proc.process!.stderr!.on("data", (data) => {
    console.error(styleText("red", options.label ?? "[cli]"), data.toString());
  });
  return proc;
}

async function findPort(proc: ReturnType<typeof runCli>): Promise<number> {
  let output = "";
  return new Promise((resolve) => {
    proc.process!.stdout!.on("data", (data) => {
      output += stripVTControlCharacters(String(data));
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        resolve(Number(match[1]));
      }
    });
  });
}

async function waitCliDone(proc: ReturnType<typeof runCli>) {
  return new Promise<void>((resolve) => {
    proc.process!.on("exit", () => {
      resolve();
    });
  });
}

function killProcess(proc: ReturnType<typeof runCli>) {
  if (process.platform === "win32") {
    x("taskkill", ["/pid", String(proc.process!.pid), "/t", "/f"]);
  } else {
    proc.kill();
  }
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
      const done = waitCliDone(proc);
      const port = await findPort(proc);
      baseURL = `http://localhost:${port}`;
      cleanup = async () => {
        killProcess(proc);
        await done;
      };
    }
    if (options.mode === "build") {
      if (!process.env.TEST_SKIP_BUILD) {
        await runCli({
          command: `pnpm build`,
          label: `[fixture:build:${options.root}]`,
          cwd: options.root,
        });
      }
      const proc = runCli({
        command: `pnpm preview`,
        label: `[fixture:preview:${options.root}]`,
        cwd: options.root,
      });
      const done = waitCliDone(proc);
      const port = await findPort(proc);
      baseURL = `http://localhost:${port}`;
      cleanup = async () => {
        killProcess(proc);
        await done;
      };
    }
  });

  test.afterAll(async () => {
    test.setTimeout(5000);
    await cleanup?.();
  });

  return {
    mode: options.mode,
    root: options.root,
    url: () => baseURL,
  };
}
