import { Counter } from "./components/counter";
import type { ModuleMap, WebpackRequire } from "./react-types";

// TODO: build?

// TODO: dynamic import?
const myModules: Record<string, Promise<unknown>> = {
  "/src/components/counter.tsx": Promise.resolve({
    Counter,
  }),
};

const myWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return myModules[id]!;
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
              id: "/src/components/counter.tsx",
              name: "Counter",
              chunks: [],
            };
          },
        }
      );
    },
  }
);
