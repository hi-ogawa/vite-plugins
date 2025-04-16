import { memoize } from "@hiogawa/utils";
import { removeReferenceCacheTag } from "./shared";

let init = false;
export function initializeReactClientBrowser(options: {
  load: (id: string) => Promise<unknown>;
}): void {
  if (init) return;
  init = true;

  (globalThis as any).__webpack_require__ = memoize((id: string) => {
    id = removeReferenceCacheTag(id);
    return options.load(id);
  });
}
