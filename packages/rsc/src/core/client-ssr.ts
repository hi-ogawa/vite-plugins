import { memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "../types";
import { SERVER_REFERENCE_PREFIX } from "./shared";

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
  if (id.startsWith(SERVER_REFERENCE_PREFIX)) {
    return (globalThis as any).__vite_rsc_server_require__(id);
  }

  if (import.meta.env.DEV) {
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
