import { memoize, tinyassert } from "@hiogawa/utils";

async function importClientRefrence(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "virtual:client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

function initializeReactClientBrowser(): void {
  Object.assign(globalThis, {
    __webpack_require__: memoize(importClientRefrence),
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}

initializeReactClientBrowser();
