import { memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "../types";
import { removeReferenceCacheTag } from "./shared";

let init = false;
export function initializeReactClientSsr(options: {
  load: (id: string) => unknown;
  prepareDestination?: (id: string) => void;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    return options.load(removeReferenceCacheTag(id));
  });

  (globalThis as any).__vite_rsc_client_require__ = (id: string) => {
    options.prepareDestination?.(removeReferenceCacheTag(id));
    return requireModule(id);
  };
}

export function createSsrModuleMap(): ModuleMap {
  return new Proxy(
    {},
    {
      get(_target, id, _receiver) {
        return new Proxy(
          {},
          {
            get(_target, name, _receiver) {
              tinyassert(typeof id === "string");
              tinyassert(typeof name === "string");
              return {
                id,
                name,
                chunks: [],
              } satisfies ImportManifestEntry;
            },
          },
        );
      },
    },
  );
}
