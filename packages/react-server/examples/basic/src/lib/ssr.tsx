import { DefaultMap, memoize, tinyassert } from "@hiogawa/utils";
import { unwrapRenderId } from "./shared";
import type { WebpackRequire } from "./types";

const memoImport = memoize(ssrImport);

// during dev, import cache needs to be isolated for each RSC + SSR run
// so that import/ssrLoadModule will load fresh module
// while keeping Promise stable during the single render for requireAsyncModule trick:
//   https://github.com/facebook/react/pull/26985
//   https://github.com/facebook/react/pull/26926#discussion_r1236251023
//
// Alternative:
//   use AsyncLocalStorage to differentiate each run.
//   however it's not supported well on Stackblitz, so we avoid relying on it for now.
//
const memoImportByRenderId = new DefaultMap<string, WebpackRequire>(() =>
  memoize(ssrImport)
);

// cleanup importCache after render to avoid leaking memory during dev
export function invalidateImportCacheOnFinish<T>(renderId: string) {
  return new TransformStream<T, T>({
    flush() {
      memoImportByRenderId.delete(renderId);
    },
  });
}

// __webpack_require__ is called at least twice for preloadModule and requireModule
// https://github.com/facebook/react/blob/706d95f486fbdec35b771ea4aaf3e78feb907249/packages/react-server-dom-webpack/src/ReactFlightClientConfigBundlerWebpack.js
const ssrWebpackRequire: WebpackRequire = (id) => {
  if (import.meta.env.DEV) {
    const [file, renderId] = unwrapRenderId(id);
    return memoImportByRenderId.get(renderId)(file);
  } else {
    return memoImport(id);
  }
};

async function ssrImport(id: string): Promise<unknown> {
  if (import.meta.env.DEV) {
    // transformed to `ssrLoadModule` during dev
    return import(/* @vite-ignore */ id);
  } else {
    // `as string` to silence ts error
    const clientReferences = await import(
      "/dist/rsc/client-references.js" as string
    );
    const dynImport = clientReferences.default[id];
    tinyassert(dynImport, `client reference not found '${id}'`);
    return dynImport();
  }
}

export function initDomWebpackSsr() {
  Object.assign(globalThis, {
    __webpack_require__: ssrWebpackRequire,
    __webpack_chunk_load__: () => {
      throw new Error("todo: __webpack_chunk_load__");
    },
  });
}
