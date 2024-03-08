import { once } from "@hiogawa/utils";
import type { ModuleMap, WebpackRequire } from "./react-types";

// TODO: build?

// __webpack_require__ needs to return stable promise during single render
// TODO: how to invalidate?
const importOnce = once((id: string) => import(/* @vite-ignore */ id));

const csrWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return importOnce(id);
};

export function initDomCsr() {
  Object.assign(globalThis, { __webpack_require__: csrWebpackRequire });
}

export const myModuleMap: ModuleMap = new Proxy(
  {},
  {
    get(_target, id, _receiver) {
      console.log("[moduleMap]", { id });
      return new Proxy(
        {},
        {
          get(_target, name, _receiver) {
            console.log("[moduleMap]", { id, name });
            return {
              id,
              name,
              chunks: [],
            };
          },
        }
      );
    },
  }
);
