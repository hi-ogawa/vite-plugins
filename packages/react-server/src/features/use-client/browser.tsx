import { memoize, tinyassert } from "@hiogawa/utils";

// __webpack_require__ needs to return stable promise during single render.
//   https://github.com/facebook/react/pull/26985
//   https://github.com/facebook/react/pull/26926#discussion_r1236251023
// vite uses import with timestamp paramemter during dev,
// so manual invalidation doesn't look necessary for client?

async function importWrapper(id: string) {
  if (import.meta.env.DEV) {
    // `__raw_import` injected via inline script
    return (globalThis as any).__raw_import(id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initializeReactClientBrowser() {
  Object.assign(globalThis, {
    __webpack_require__: memoize(importWrapper),
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}
