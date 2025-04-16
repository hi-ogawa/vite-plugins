import { memoize, tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../types";
import {
  SERVER_REFERENCE_PREFIX,
  createReferenceCacheTag,
  removeReferenceCacheTag,
} from "./shared";

let init = false;
export function initializeReactServer(): void {
  if (init) return;
  init = true;

  (globalThis as any).__webpack_require__ = (id: string) => {
    if (id.startsWith(SERVER_REFERENCE_PREFIX)) {
      return (globalThis as any).__vite_rsc_server_require__(id);
    }
    return (globalThis as any).__vite_rsc_client_require__(id);
  };

  // need memoize to return stable promise from __webpack_require__
  (globalThis as any).__vite_rsc_server_require__ = memoize(requireModule);
}

export async function importServerReference(id: string): Promise<Function> {
  const [file, name] = id.split("#") as [string, string];
  const mod: any = await requireModule(file);
  return mod[name];
}

async function requireModule(id: string): Promise<unknown> {
  id = removeReferenceCacheTag(id);

  tinyassert(
    id.startsWith(SERVER_REFERENCE_PREFIX),
    `invalid server reference '${id}'`,
  );
  id = id.slice(SERVER_REFERENCE_PREFIX.length);

  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const references = await import(
      "virtual:vite-rsc/server-references" as string
    );
    const dynImport = references.default[id];
    tinyassert(dynImport, `server reference not found '${id}'`);
    return dynImport();
  }
}

export function createServerReferenceConfig(): BundlerConfig {
  const cacheTag = import.meta.env.DEV ? createReferenceCacheTag() : "";

  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id: id + cacheTag,
          name,
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}

export function createClientReferenceConfig(): BundlerConfig {
  const cacheTag = import.meta.env.DEV ? createReferenceCacheTag() : "";

  return new Proxy(
    {},
    {
      get(_target, $$id, _receiver) {
        tinyassert(typeof $$id === "string");
        let [id, name] = $$id.split("#");
        tinyassert(id);
        tinyassert(name);
        return {
          id: id + cacheTag,
          name,
          // support of prepareDestination preloading is done manually inside __webpack_require__
          // (see packages/rsc/src/core/client-ssr.ts)
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}
