import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/browser.ts",
    "src/ssr.ts",
    "src/rsc.ts",
    "src/core/browser.ts",
    "src/core/ssr.ts",
    "src/core/rsc.ts",
    "src/extra/server.tsx",
    "src/extra/ssr.tsx",
    "src/extra/browser.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
