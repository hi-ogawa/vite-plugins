import * as clientReferences from "virtual:vite-rsc/client-references";
import { memoize, tinyassert } from "@hiogawa/utils";
import ReactDOM from "react-dom";
import type { ImportManifestEntry, ModuleMap } from "../types";
import { SERVER_REF_PREFIX } from "./shared";

let init = false;
export function initializeReactClientSsr(): void {
  if (init) return;
  init = true;

  Object.assign(globalThis, {
    __webpack_require__: requireModule,
    __webpack_chunk_load__: async () => {},
  });
}

function requireModule(id: string) {
  if (id.startsWith(SERVER_REF_PREFIX)) {
    return (globalThis as any).__vite_rsc_server_require__(id);
  }
  prepareDestination(id);
  return requireModuleInner(id);
}

// we manually run `preloadModule` instead of react-server-dom-webpack's prepareDestinationWithChunks (see packages/rsc/src/core/server.ts)
// maybe we can have this logic baked in react-server-dom-vite
function prepareDestination(id: string) {
  if (import.meta.env.DEV) {
    ReactDOM.preloadModule(id);
  } else {
    if (clientReferences.assetDeps) {
      const deps = clientReferences.assetDeps[id];
      if (deps) {
        for (const js of deps.js) {
          ReactDOM.preloadModule(js);
        }
      }
    }
  }
}

// async part is memoized to have stable promise returned from `__webpack_require__`
const requireModuleInner = memoize((id: string) => {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
});

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
