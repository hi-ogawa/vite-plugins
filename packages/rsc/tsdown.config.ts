import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/browser.ts",
    "src/ssr.tsx",
    "src/rsc.tsx",
    "src/vite-utils.ts",
    "src/core/browser.ts",
    "src/core/ssr.ts",
    "src/core/rsc.ts",
    "src/core/plugin.ts",
    "src/react/browser.ts",
    "src/react/ssr.ts",
    "src/react/rsc.ts",
    "src/extra/browser.tsx",
    "src/extra/ssr.tsx",
    "src/extra/rsc.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
