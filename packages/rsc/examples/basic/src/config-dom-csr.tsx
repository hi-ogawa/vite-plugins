import { once } from "@hiogawa/utils";
import type { WebpackRequire } from "./react-types";

// TODO: build?

// __webpack_require__ needs to return stable promise during single render
// TODO: how to invalidate?
const importOnce = once((id: string) => import(/* @vite-ignore */ id));

const csrWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return importOnce(id);
};

export function initDomWebpackCsr() {
  Object.assign(globalThis, { __webpack_require__: csrWebpackRequire });
}
