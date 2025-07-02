import type { SpawnOptions } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stripVTControlCharacters, styleText } from "node:util";
import { tinyassert } from "@hiogawa/utils";
import test, { type Page, expect } from "@playwright/test";
import { x } from "tinyexec";

// TODO: separate to fixture.ts?
export type FixtureHelper = {
  mode?: "dev" | "build";
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
}): FixtureHelper {
  let cleanup: (() => Promise<void>) | undefined;
  let baseURL!: string;

  const cwd = path.resolve(options.root);

  test.beforeAll(async () => {
    if (options.mode === "dev") {
      const proc = runCli({
        command: `pnpm -C ${options.root} dev`,
        label: `[fixture:dev:${options.root}]`,
        cwd,
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
          command: `pnpm -C ${options.root} build`,
          label: `[fixture:build:${options.root}]`,
          cwd,
        });
      }
      const proc = runCli({
        command: `pnpm -C ${options.root} preview`,
        label: `[fixture:preview:${options.root}]`,
        cwd,
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
    url: () => baseURL,
  };
}

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});

export async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => {
      const el = document.querySelector("body");
      if (el) {
        const keys = Object.keys(el);
        return keys.some((key) => key.startsWith("__reactFiber"));
      }
    },
    null,
    { timeout: 3000 },
  );
}

export async function expectNoReload(page: Page) {
  // inject custom meta
  await page.evaluate(() => {
    const el = document.createElement("meta");
    el.setAttribute("name", "x-reload-check");
    document.head.append(el);
  });

  // TODO: playwright prints a weird error on dispose error,
  // so maybe we should avoid this pattern :(
  return {
    [Symbol.asyncDispose]: async () => {
      // check if meta is preserved
      await expect(page.locator(`meta[name="x-reload-check"]`)).toBeAttached({
        timeout: 1,
      });
      await page.evaluate(() => {
        document.querySelector(`meta[name="x-reload-check"]`)!.remove();
      });
    },
  };
}

export function createEditor(filepath: string) {
  const init = readFileSync(filepath, "utf-8");
  originalFiles[filepath] ??= init;
  let current = init;
  return {
    edit(editFn: (data: string) => string): void {
      const next = editFn(current);
      tinyassert(next !== current);
      current = next;
      writeFileSync(filepath, next);
    },
    reset(): void {
      writeFileSync(filepath, init);
    },
  };
}

const originalFiles: Record<string, string> = {};

test.afterAll(() => {
  for (const [filepath, content] of Object.entries(originalFiles)) {
    writeFileSync(filepath, content);
  }
});
