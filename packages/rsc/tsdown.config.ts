import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/browser.ts",
    "src/ssr.ts",
    "src/rsc.ts",
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
    "src/extra/utils/rsc-script.ts",
  ],
  format: ["esm"],
  external: [/^virtual:/],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
