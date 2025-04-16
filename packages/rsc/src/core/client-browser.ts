import { memoize } from "@hiogawa/utils";
import { removeReferenceCacheTag } from "./shared";

let init = false;
export function initializeReactClientBrowser(options: {
  load: (id: string) => Promise<unknown>;
}): void {
  if (init) return;
  init = true;

  const requireModule = memoize((id: string) => {
    return options.load(removeReferenceCacheTag(id));
  });

  (globalThis as any).__webpack_require__ = requireModule;
}
