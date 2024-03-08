import { AsyncLocalStorage } from "node:async_hooks";
import { once, tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./react-types";

// cached import for stable Promise during each rendering
const ssrStorage = new AsyncLocalStorage<{ cachedImport: WebpackRequire }>();

const ssrWebpackRequire: WebpackRequire = (id) => {
  const store = ssrStorage.getStore();
  tinyassert(store);
  return store.cachedImport(id);
};

export function initDomSsr() {
  Object.assign(globalThis, { __webpack_require__: ssrWebpackRequire });
}

export function runWithSsrContext<T>(callback: () => T): T {
  return ssrStorage.run(
    { cachedImport: once((id: string) => import(/* @vite-ignore */ id)) },
    callback
  );
}
