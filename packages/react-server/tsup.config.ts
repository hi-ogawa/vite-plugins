import { defineConfig } from "tsup";
import { IsolatedDecl } from "unplugin-isolated-decl";

export default defineConfig([
  {
    entry: [
      "src/index.ts",
      "src/server.ts",
      "src/client.tsx",
      "src/runtime/server.ts",
      "src/runtime/client.ts",
      "src/runtime/browser.ts",
      "src/runtime/ssr.ts",
      "src/entry/server.tsx",
      "src/entry/ssr.tsx",
      "src/entry/browser.tsx",
      "src/plugin/index.ts",
    ],
    format: ["esm"],
    esbuildPlugins: [
      IsolatedDecl.esbuild({
        transformer: "oxc",
        sourceMap: true,
      }),
    ],
    esbuildOptions(options) {
      // TODO: workaround for .d.ts.map generation. currently both side don't support it unless `write: true`.
      // https://github.com/egoist/tsup/blob/773d27e6dc9dffc8cab290706ce45d2c7ef09a55/src/plugin.ts#L124
      // https://github.com/unplugin/unplugin-isolated-decl/blob/5c028edebe2790e757b8cfcb2dc1bb9222173d8d/src/index.ts#L408
      options.write = true;
    },
    external: [/^virtual:/, /^@hiogawa\/react-server\//, /^\/dist\//],
  },
]) as any;
