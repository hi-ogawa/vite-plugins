import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/plugin.ts",
    "src/entry.browser.tsx",
    "src/entry.rsc.tsx",
    "src/entry.rsc.node.tsx",
    "src/entry.ssr.tsx",
    "src/lib/client.tsx",
  ],
  format: ["esm"],
  external: [/^virtual:/],
  dts: {
    sourceMap: process.argv.slice(2).includes("--sourcemap"),
  },
  bundleDts: false,
}) as any;
