import { defineConfig } from "tsup";
import IsolatedDecl from "unplugin-isolated-decl/esbuild";

export default defineConfig([
  {
    entry: [
      // "src/lib/plugin.ts",
      // "src/server.ts",
      // "src/client.tsx"
    ],
    format: ["esm"],
    esbuildPlugins: [IsolatedDecl()],
    // external: [/^virtual:/, /^@hiogawa\/react-server\//, /^\/dist\//],
  },
]) as any;
