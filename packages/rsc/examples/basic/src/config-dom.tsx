import { once } from "@hiogawa/utils";
import type { ModuleMap, WebpackRequire } from "./react-types";

// TODO: build?

// __webpack_require__ needs to return stable promise during single render
// TODO: how to invalidate?
const importOnce = once((id: string) => import(/* @vite-ignore */ id));

const myWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return importOnce(id);
};

export function initDomWebpack() {
  Object.assign(globalThis, { __webpack_require__: myWebpackRequire });
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
