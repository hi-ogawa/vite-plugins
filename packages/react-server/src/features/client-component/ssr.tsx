import { createDebug, memoize, tinyassert } from "@hiogawa/utils";
import type {
  ImportManifestEntry,
  ModuleMap,
  WebpackRequire,
} from "../../types/react";

const debug = createDebug("react-server:ssr-import");

// __webpack_require__ is called at least (maybe exactly?) twice for preloadModule and requireModule
// https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js
// We use `memoize` since `__webpack_require__` needs to return stable promise during each render.
// During dev, memoize cache is invalidated before each render,
// so the SSR will load fresh module in each time.
// Note that memoize cache invalidation doesn't need to be so precise at all
// since vite's ssrLoadModule has cache already
// and memoize cache is used only to make `ssrLoadModule`'s promise stable.
export const ssrImportPromiseCache = new Map<string, Promise<unknown>>();

const ssrWebpackRequire: WebpackRequire = memoize(ssrImport, {
  cache: ssrImportPromiseCache,
});

async function ssrImport(id: string) {
  debug("[__webpack_require__]", { id });
  if (import.meta.env.DEV) {
    // strip off `?t=` added for browser by noramlizeClientReferenceId
    id = id.split("?t=")[0]!;
    // transformed to "ssrLoadModule" during dev
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

export function initializeReactClientSsr() {
  Object.assign(globalThis, {
    __webpack_require__: ssrWebpackRequire,
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}

export function createModuleMap(): ModuleMap {
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
