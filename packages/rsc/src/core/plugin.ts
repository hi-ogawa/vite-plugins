import type { Plugin } from "vite";

export default function vitePluginRscCore(): Plugin[] {
  return [
    {
      name: "rsc:patch-react-server-dom-webpack",
      transform(code, _id, _options) {
        if (code.includes("__webpack_require__.u")) {
          // avoid accessing `__webpack_require__` on import side effect
          // https://github.com/facebook/react/blob/a9bbe34622885ef5667d33236d580fe7321c0d8b/packages/react-server-dom-webpack/src/client/ReactFlightClientConfigBundlerWebpackBrowser.js#L16-L17
          code = code.replaceAll("__webpack_require__.u", "({}).u");
          return { code, map: null };
        }
      },
    },
    {
      // commonjsOptions needs to be tweaked when this is a linked dep
      // since otherwise vendored cjs doesn't work.
      name: "rsc:workaround-linked-dep",
      apply: () => !import.meta.url.includes("/node_modules/"),
      configEnvironment() {
        return {
          build: {
            commonjsOptions: {
              include: [/\/node_modules\//, /\/vendor\/react-server-dom\//],
            },
          },
        };
      },
    },
  ];
}
