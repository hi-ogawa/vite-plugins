import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { stripVTControlCharacters } from "node:util";
import { tinyassert } from "@hiogawa/utils";
import { type Page, expect, test } from "@playwright/test";

export type FixtureHelper = {
  mode: "dev" | "build";
  url: () => string;
};

function runCli(command: string, label: string) {
  const [name, ...args] = command.split(" ");
  const proc = spawn(name!, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (process.env.TEST_PIPE_STDIN) {
    proc.stdout!.on("data", (data) => {
      console.log(label, data.toString());
    });
  }
  proc.stderr!.on("data", (data) => {
    console.error(label, data.toString());
  });
  return proc;
}

async function findPort(proc: ReturnType<typeof runCli>): Promise<number> {
  let output = "";
  return new Promise((resolve) => {
    proc.stdout!.on("data", (data) => {
      output += stripVTControlCharacters(String(data));
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) {
        resolve(Number(match[1]));
      }
    });
  });
}

async function waitClosed(proc: ReturnType<typeof runCli>) {
  return new Promise<void>((resolve) => {
    proc.on("close", () => {
      resolve();
    });
  });
}

export function setupFixtureDev(options: {
  root: string;
}): FixtureHelper {
  let cleanup: (() => Promise<void>) | undefined;
  let baseURL!: string;

  test.beforeAll(async () => {
    const proc = runCli(
      `pnpm -C ${options.root} dev`,
      `[fixture:dev:${options.root}]`,
    );
    const closed = waitClosed(proc);
    const port = await findPort(proc);
    baseURL = `http://localhost:${port}`;
    cleanup = async () => {
      proc.kill();
      await closed;
    };
  });

  test.afterAll(async () => {
    await cleanup?.();
  });

  return {
    mode: "dev",
    url: () => baseURL,
  };
}

export function setupFixtureBuild(options: {
  root: string;
}): FixtureHelper {
  let cleanup: (() => Promise<void>) | undefined;
  let baseURL!: string;

  test.beforeAll(async () => {
    if (!process.env.TEST_SKIP_BUILD) {
      const proc = runCli(
        `pnpm -C ${options.root} build`,
        `[fixture:build:${options.root}]`,
      );
      await waitClosed(proc);
    }
    const proc = runCli(
      `pnpm -C ${options.root} preview`,
      `[fixture:preview:${options.root}]`,
    );
    const closed = waitClosed(proc);
    const port = await findPort(proc);
    baseURL = `http://localhost:${port}`;
    cleanup = async () => {
      proc.kill();
      await closed;
    };
  });

  test.afterAll(async () => {
    await cleanup?.();
  });

  return {
    mode: "build",
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
