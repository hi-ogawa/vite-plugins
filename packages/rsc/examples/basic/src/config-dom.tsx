import type {
  ModuleMap,
  WebpackRequire,
} from "react-server-dom-webpack/client.edge";
import { Counter } from "./components/counter";

const myModules: Record<string, Promise<unknown>> = {
  __some_module_id: Promise.resolve({
    __some_module_name: Counter,
  }),
};

export const myWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return myModules[id]!;
};

export const myModuleMap: ModuleMap = new Proxy(
  {
    __some_module_id: {
      __some_module_name: {
        id: "__some_module_id",
        name: "__some_module_name",
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
