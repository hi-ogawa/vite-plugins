import { defineConfig } from "tsup";
import IsolatedDecl from "unplugin-isolated-decl/esbuild";

export default defineConfig([
  {
    entry: [
      "src/plugin.ts",
      "src/server.tsx",
      "src/server-runtime.tsx",
      "src/ssr.tsx",
      "src/ssr-runtime.tsx",
      "src/browser.tsx",
      "src/browser-runtime.tsx",
    ],
    format: ["esm"],
    esbuildPlugins: [IsolatedDecl()],
    external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  },
]) as any;
