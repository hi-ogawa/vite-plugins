import { memoize } from "@hiogawa/utils";
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
