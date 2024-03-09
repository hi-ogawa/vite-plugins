import { AsyncLocalStorage } from "node:async_hooks";
import { once, tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "./react-types";

// cached import for stable Promise during each rendering
// TODO: stable ssrLoadModule by checking module cache first?
const ssrStorage = new AsyncLocalStorage<{ cachedImport: WebpackRequire }>();

const ssrWebpackRequire: WebpackRequire = (id) => {
  console.log("[__webpack_require__]", { id });
  const store = ssrStorage.getStore();
  tinyassert(store);
  return store.cachedImport(id);
};

export async function initDomWebpackSsr() {
  if (import.meta.env.DEV) {
    Object.assign(globalThis, { __webpack_require__: ssrWebpackRequire });
  } else {
    if ("__webpack_require__" in globalThis) {
      return;
    }
    // @ts-ignore
    const clientReferences = await import("/dist/rsc/client-references.js");
    const webpackRequire: WebpackRequire = (id) => {
      const dynImport = clientReferences[id];
      tinyassert(dynImport, `client reference not found '${id}'`);
      return dynImport();
    };
    Object.assign(globalThis, { __webpack_require__: once(webpackRequire) });
  }
}

export function runWithSsrContext<T>(callback: () => T): T {
  const cachedImport = once((id: string) => import(/* @vite-ignore */ id));
  return ssrStorage.run({ cachedImport }, callback);
}
