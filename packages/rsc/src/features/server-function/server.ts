import { memoize, tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../../types";

export async function importServerAction(id: string): Promise<Function> {
  const [file, name] = id.split("#") as [string, string];
  const mod: any = await importServerReference(file);
  return mod[name];
}

async function importServerReference(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const references = await import("virtual:server-references" as string);
    const dynImport = references.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}

export function createActionBundlerConfig(): BundlerConfig {
  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id,
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

let init = false;
export function initializeReactServer(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __vite_react_server_webpack_require__: memoize(importServerReference),
    __vite_react_server_webpack_chunk_load__: () => {
      throw new Error("__webpack_chunk_load__");
    },
  });
}
