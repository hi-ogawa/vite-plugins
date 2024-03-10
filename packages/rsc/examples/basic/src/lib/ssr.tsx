import { DefaultMap, memoize, tinyassert } from "@hiogawa/utils";
import { unwrapRenderId } from "./shared";
import type { WebpackRequire } from "./types";

const memoImport = memoize(ssrImport);

// during dev, import cache needs to be isolated for each RSC + SSR run
// so that import/ssrLoadModule will load fresh module
// but keeping Promise stable during the single render.
// Alternative approach would be to use AsyncLocalStorage to differentiate each run,
// however it's not supported on Stackblitz, so for now, we avoid relying on it.
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
  Object.assign(globalThis, { __webpack_require__: ssrWebpackRequire });
}
