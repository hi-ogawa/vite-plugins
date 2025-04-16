import { memoize, tinyassert } from "@hiogawa/utils";
import type { BundlerConfig, ImportManifestEntry } from "../types";
import {
  SERVER_REFERENCE_PREFIX,
  createReferenceCacheTag,
  removeReferenceCacheTag,
} from "./shared";

let init = false;
let requireModule!: (id: string) => unknown;

export function initializeReactServer(options: {
  load: (id: string) => unknown;
}): void {
  if (init) return;
  init = true;

  requireModule = (id) => {
    return options.load(removeReferenceCacheTag(id));
  };

  // need memoize to return stable promise from __webpack_require__
  const requireModuleMemoized = memoize(requireModule);

  (globalThis as any).__webpack_require__ = (id: string) => {
    if (id.startsWith(SERVER_REFERENCE_PREFIX)) {
      id = id.slice(SERVER_REFERENCE_PREFIX.length);
      return requireModuleMemoized(id);
    }
    return (globalThis as any).__vite_rsc_client_require__(id);
  };
}

export async function importServerReference(id: string): Promise<Function> {
  const [file, name] = id.split("#") as [string, string];
  const mod: any = await requireModule(file);
  return mod[name];
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
          id: SERVER_REFERENCE_PREFIX + id + cacheTag,
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
          chunks: [],
          async: true,
        } satisfies ImportManifestEntry;
      },
    },
  );
}
