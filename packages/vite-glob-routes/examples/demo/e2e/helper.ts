import { exec } from "node:child_process";
import { promisify } from "node:util";
import { type Page, test } from "@playwright/test";

const execPromise = promisify(exec);

export async function getSessionCookie(name: string): Promise<string> {
  const result = await execPromise(`pnpm -s cli getSessionCookie ${name}`, {
    // need to counteract playwright esm module loader
    // https://github.com/microsoft/playwright/blob/d92fe16b76272afb19e7af5a2496f7efce45441d/packages/playwright-test/src/cli.ts#L279
    env: {
      ...process.env,
      NODE_OPTIONS: undefined,
    },
  });
  return result.stdout;
}

export async function isPageReady(page: Page) {
  await page.locator("#root.hydrated").waitFor({ state: "attached" });
}

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});
