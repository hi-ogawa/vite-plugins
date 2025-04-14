import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/server.tsx",
    "src/server-runtime.tsx",
    "src/ssr.tsx",
    "src/ssr-node.tsx",
    "src/ssr-runtime.tsx",
    "src/browser.tsx",
    "src/browser-runtime.tsx",
    "src/core/client-browser.ts",
    "src/core/client-ssr.ts",
    "src/core/plugin.ts",
    "src/core/server.ts",
    "src/core/shared.ts",
  ],
  format: ["esm"],
  external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
