import { createDebug, memoize, tinyassert } from "@hiogawa/utils";
import { __global } from "./global";
import type { ImportManifestEntry, ModuleMap, WebpackRequire } from "./types";

const debug = createDebug("react-server:ssr-import");

async function ssrImport(id: string) {
  debug("[__webpack_require__]", { id });
  if (import.meta.env.DEV) {
    // transformed to "ssrLoadModule" during dev
    return import(/* @vite-ignore */ id);
  } else {
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export async function initDomWebpackSsr() {
  // __webpack_require__ is called at least twice for preloadModule and requireModule
  // https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js
  // We use `memoize` since `__webpack_require__` needs to
  // return stable promise during each render.
  // Import cache is invaliadted manually in the plugin
  // so that SSR will load fresh module on any change.
  // Note that `ssrImportCache` cache invalidation doesn't need to be so precise
  // since vite's ssrLoadModule has cache already
  // and `ssrImportCache` is only to make `ssrLoadModule`'s promise stable.
  const cache = import.meta.env.DEV ? __global.dev.ssrImportCache : undefined;
  const ssrWebpackRequire: WebpackRequire = memoize(ssrImport, { cache });

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
