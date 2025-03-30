import { defineConfig } from "tsup";
import IsolatedDecl from "unplugin-isolated-decl/esbuild";

export default defineConfig([
  {
    entry: [
      "src/plugin.ts",
      "src/server.tsx",
      "src/ssr.tsx",
      "src/browser.tsx",
    ],
    format: ["esm"],
    esbuildPlugins: [IsolatedDecl()],
    external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  },
]) as any;
