import { defineConfig } from "tsdown";

export default defineConfig({
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
  external: [/^virtual:/, /^@hiogawa\/vite-rsc\//],
  dts: true,
  bundleDts: false,
}) as any;
