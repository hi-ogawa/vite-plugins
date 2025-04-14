import { memoize, tinyassert } from "@hiogawa/utils";
import ReactDOM from "react-dom";
import type { ImportManifestEntry, ModuleMap } from "../types";

let init = false;
export function initializeReactClientSsr(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __webpack_require__: memoize(importClientReferenceModule),
    __webpack_chunk_load__: async () => {},
  });
}

async function importClientReferenceModule(id: string) {
  if (import.meta.env.DEV) {
    // TODO: move this out of memoized __webpack_require__
    ReactDOM.preloadModule(id);

    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "virtual:vite-rsc/client-references" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
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
