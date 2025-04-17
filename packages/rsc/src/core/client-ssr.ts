import { memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "../types";
import { removeReferenceCacheTag } from "./shared";

let init = false;

export function setRequireModule(options: {
  load: (id: string) => unknown;
  prepareDestination?: (id: string) => void;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    return options.load(removeReferenceCacheTag(id));
  });

  const clientRequire = (id: string) => {
    options.prepareDestination?.(removeReferenceCacheTag(id));
    return requireModule(id);
  };

  // define __webpack_require__ in case ssr and rsc don't shared the same global
  (globalThis as any).__webpack_require__ ??= clientRequire;
  (globalThis as any).__vite_rsc_client_require__ = clientRequire;
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
