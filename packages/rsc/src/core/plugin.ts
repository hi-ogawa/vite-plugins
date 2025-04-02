import type { Plugin } from "vite";

export function vitePluginRscCore(rscOptions: {
  getClientReferences: () => Record<string, string>;
  getServerReferences: () => Record<string, string>;
}): Plugin[] {
  return [
    {
      name: "rsc-virtual",
      resolveId(source) {
        if (source.startsWith("virtual:vite-rsc/")) {
          return "\0" + source;
        }
      },
      load(id) {
        const references =
          id === "\0virtual:vite-rsc/client-references"
            ? rscOptions.getClientReferences()
            : id === "\0virtual:vite-rsc/server-references"
              ? rscOptions.getServerReferences()
              : undefined;
        if (references) {
          const code = Object.keys(references)
            .map(
              (id) =>
                `${JSON.stringify(id)}: () => import(${JSON.stringify(id)}),`,
            )
            .join("\n");
          return { code: `export default {${code}}`, map: null };
        }
      },
    },
    {
      name: "rsc-patch-webpack",
      transform(code, id, _options) {
        if (
          this.environment?.name === "rsc" &&
          id.includes("react-server-dom-webpack") &&
          code.includes("__webpack_require__")
        ) {
          // rename webpack markers in rsc runtime
          // to avoid conflict with ssr runtime which shares same globals
          code = code.replaceAll(
            "__webpack_require__",
            "__vite_rsc_webpack_require__",
          );
          code = code.replaceAll(
            "__webpack_chunk_load__",
            "__vite_rsc_webpack_chunk_load__",
          );
          return { code, map: null };
        }
        if (
          this.environment?.name === "client" &&
          id.includes("react-server-dom-webpack") &&
          code.includes("__webpack_require__")
        ) {
          // avoid accessing `__webpack_require__` on import side effect
          // https://github.com/facebook/react/blob/a9bbe34622885ef5667d33236d580fe7321c0d8b/packages/react-server-dom-webpack/src/client/ReactFlightClientConfigBundlerWebpackBrowser.js#L16-L17
          code = code.replaceAll("__webpack_require__.u", "({}).u");
          return { code, map: null };
        }
        return;
      },
    },
  ];
}
