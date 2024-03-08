import type { BundlerConfig } from "react-server-dom-webpack/server.edge";

// TODO: auto generate

export const myBundlerConfig: BundlerConfig = new Proxy(
  {
    bundlerId: {
      id: "moduleId",
      name: "moduleName",
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
