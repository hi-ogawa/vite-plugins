import fs from "node:fs";
import test, { type Page, expect } from "@playwright/test";
import type { Manifest } from "vite";

export async function waitForHydration(page: Page) {
  await expect(page.getByText("[hydrated: 1]")).toBeVisible();
}

export async function setupCheckClientState(page: Page) {
  // setup client state
  await page.getByPlaceholder("test-input").fill("hello");

  return async () => {
    // verify client state is preserved
    await expect(page.getByPlaceholder("test-input")).toHaveValue("hello");
  };
}

//
// page error check
//

const pageErrorsMap = new WeakMap<Page, Error[]>();

test.afterEach(({ page }) => {
  const errors = pageErrorsMap.get(page);
  if (errors) {
    expect(errors).toEqual([]);
  }
});

export function checkNoError(page: Page) {
  const pageErrors: Error[] = [];
  pageErrorsMap.set(page, pageErrors);
  page.on("pageerror", (e) => pageErrors.push(e));
}

//
// file edit utils
//

const originalFileMap = new Map<string, string>();

test.afterEach(async () => {
  for (const [filepath, data] of originalFileMap) {
    await fs.promises.writeFile(filepath, data);
  }
  originalFileMap.clear();
});

export async function editFile(
  filepath: string,
  edit: (data: string) => string,
) {
  const data = await fs.promises.readFile(filepath, "utf-8");
  if (!originalFileMap.has(filepath)) {
    originalFileMap.set(filepath, data);
  }
  await fs.promises.writeFile(filepath, edit(data));
}

export async function inspectDevModules<T extends string>(
  page: Page,
  urls: readonly T[],
) {
  const result = {} as Record<T, Record<"ssr" | "react-server", any>>;
  for (const url of urls) {
    result[url] = {
      ssr: await requestApi(page, {
        type: "module",
        environment: "ssr",
        url,
      }),
      "react-server": await requestApi(page, {
        type: "module",
        environment: "react-server",
        url,
      }),
    };
  }
  return result;

  async function requestApi(page: Page, data: any) {
    const res = await page.request.post("/__react_server_dev", { data });
    return await res.json();
  }
}

export const testNoJs = test.extend({
  javaScriptEnabled: ({}, use) => use(false),
});

export function getClientManifest(): Manifest {
  return JSON.parse(
    fs.readFileSync("dist/client/.vite/manifest.json", "utf-8"),
  );
}
