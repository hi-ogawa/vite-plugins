import type { Plugin } from "vite";

// TODO: upstream to @vitejs/plugin-react
// https://github.com/vitejs/vite-plugin-react/pull/890
export function reactHmrPreamblePlugin(): Plugin[] {
  return [
    {
      name: "fullstack:react-hmr-preamble",
      resolveId(source) {
        if (source === "virtual:react-hmr-preamble") {
          return "\0" + source;
        }
      },
      load(id) {
        if (id === "\0virtual:react-hmr-preamble") {
          if (this.environment.mode === "build") {
            return ``;
          }
          return `\
import { injectIntoGlobalHook } from "/@react-refresh";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
`;
        }
      },
    },
  ];
}
