import { memoize, tinyassert } from "@hiogawa/utils";

async function importClientRefrence(id: string) {
  if (import.meta.env.DEV) {
    // use raw import (inject in head script) to avoid `?import` added by vite import analysis
    return (self as any).__raw_import(id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientBrowser(): void {
  Object.assign(globalThis, {
    __webpack_require__: memoize(importClientRefrence),
    __webpack_chunk_load__: async () => {},
  });
}
