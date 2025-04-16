import { memoize, tinyassert } from "@hiogawa/utils";

let init = false;
export function initializeReactClientBrowser(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __webpack_require__: memoize(requireModule),
    __webpack_chunk_load__: async () => {},
  });
}

async function requireModule(id: string): Promise<unknown> {
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
