import { AsyncLocalStorage } from "node:async_hooks";
import { tinyassert } from "@hiogawa/utils";
import type { WebpackRequire } from "react-server-dom-webpack/server.edge";

// current SSR and RSC happens in the same process.
// so use async context to differentiate global context

export const globalConetxt = new AsyncLocalStorage<{ isRsc: boolean }>();

declare let __webpack_require_ssr__: WebpackRequire;

const webpackRequire: WebpackRequire = (id) => {
  const store = globalConetxt.getStore();
  console.log("[webpackRequire]", { store, id });
  // __webpack_require__ is not used by RSC
  tinyassert(!store?.isRsc);
  return __webpack_require_ssr__(id);
};

Object.assign(globalThis, {
  __webpack_require__: webpackRequire,
});
