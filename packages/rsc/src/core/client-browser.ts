import { memoize, tinyassert } from "@hiogawa/utils";
import { removeReferenceCacheTag } from "./shared";

let init = false;
export function initializeReactClientBrowser(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __turbopack_require__: memoize(requireModule),
  });
}

async function requireModule(id: string): Promise<unknown> {
  id = removeReferenceCacheTag(id);

  if (import.meta.env.DEV) {
    // use raw import (inject via getBrowserPreamble)
    // to avoid `?import` added by vite import analysis
    return (self as any).__viteRscImport(id);
  } else {
    const clientReferences = await import(
      "virtual:vite-rsc/client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}
