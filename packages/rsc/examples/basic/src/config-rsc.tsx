import type { BundlerConfig } from "react-server-dom-webpack/server.edge";

// TODO: auto generate

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
