import { memoize, tinyassert } from "@hiogawa/utils";
import type { ImportManifestEntry, ModuleMap } from "../types";

let init = false;
export function initializeReactClientSsr(): void {
  if (init) return;
  init = true;

  (globalThis as any).__vite_rsc_client_require__ = memoize(requireModule);
}

async function requireModule(id: string) {
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
