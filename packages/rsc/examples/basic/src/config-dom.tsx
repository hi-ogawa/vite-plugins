import type {
  ModuleMap,
  WebpackRequire,
} from "react-server-dom-webpack/client.edge";
import { Counter } from "./components/counter";

// TODO: auto generate

const myModules: Record<string, Promise<unknown>> = {
  moduleId: Promise.resolve({
    moduleName: Counter,
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
  {
    moduleId: {
      moduleName: {
        id: "moduleId",
        name: "moduleName",
        chunks: [],
      },
    },
  },
  {
    get(_target, id, _receiver) {
      console.log("[moduleMap]", { id });
      // @ts-ignore
      return new Proxy(Reflect.get(...arguments), {
        get(_target, name, _receiver) {
          console.log("[moduleMap]", { id, name });
          // @ts-ignore
          return Reflect.get(...arguments);
        },
      });
    },
  }
);
