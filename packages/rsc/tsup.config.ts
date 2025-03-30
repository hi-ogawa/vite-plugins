import { defineConfig } from "tsup";
import IsolatedDecl from "unplugin-isolated-decl/esbuild";

export default defineConfig([
  {
    entry: [
      "src/lib/plugin.ts",
      "src/lib/server.tsx",
      "src/lib/ssr.tsx",
      "src/lib/browser.tsx",
    ],
    format: ["esm"],
    esbuildPlugins: [IsolatedDecl()],
    external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  },
]) as any;
