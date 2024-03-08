import React from "react";
import type { ModuleMap } from "react-server-dom-webpack/client.edge";
import type {
  BundlerConfig,
  WebpackRequire,
} from "react-server-dom-webpack/server.edge";

// TODO: hooks are undefined in react-server exports?
//       that's why these two usages must live in a different module graph
//        - main: eact-server-dom-webpack/client + react-dom/server
//        - rsc: react-server-dom-webpack/server
export function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}

//
// manually setup client references and module map
// TODO: use client
//

// https://github.com/lazarv/react-server/blob/2ff6105e594666065be206729858ecfed6f5e8d8/packages/react-server/client/components.mjs#L15-L25
export function createClientReference(Component: React.FC): React.FC {
  Object.defineProperties(Component, {
    $$typeof: {
      value: Symbol.for("react.client.reference"),
    },
    $$id: {
      value: `__some_client_id`,
    },
    $$async: {
      value: true,
    },
  });
  return Component;
}

export const ClientCounter = createClientReference(Counter);

const myModules: Record<string, Promise<unknown>> = {
  __some_module_id: Promise.resolve({
    __some_module_name: () => <div>todo-client-counter</div>,
  }),
};

export const myWebpackRequire: WebpackRequire = (id) => {
  console.log("[webpackRequire]", { id });
  return myModules[id]!;
};

export const myBundlerConfig: BundlerConfig = new Proxy(
  {
    __some_client_id: {
      id: "__some_module_id",
      name: "__some_module_name",
      chunks: [],
    },
  },
  {
    get(_target, p, _receiver) {
      console.log("[bundlerConfig]", { p });
      // @ts-ignore
      return Reflect.get(...arguments);
    },
  }
);

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
