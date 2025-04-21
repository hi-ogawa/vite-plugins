import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/browser.ts",
    "src/ssr.ts",
    "src/rsc.ts",
    "src/core/client-browser.ts",
    "src/core/client-ssr.ts",
    "src/core/server.ts",
    "src/core/shared.ts",
    "src/extra/server.tsx",
    "src/extra/ssr.tsx",
    "src/extra/browser.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  dts: true,
  // dts: {
  //   sourceMap: process.argv.slice(2).includes("--sourcemap"),
  // },
  // bundleDts: false,
}) as any;
