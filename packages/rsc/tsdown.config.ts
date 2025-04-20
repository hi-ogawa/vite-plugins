import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/extra/plugin.ts",
    "src/extra/server.tsx",
    "src/extra/ssr.tsx",
    "src/extra/browser.tsx",
    "src/core/client-browser.ts",
    "src/core/client-ssr.ts",
    "src/core/server.ts",
    "src/core/shared.ts",
    "src/core2/plugin.ts",
    "src/core2/browser.ts",
    "src/core2/ssr.ts",
    "src/core2/rsc.ts",
  ],
  format: ["esm"],
  external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
