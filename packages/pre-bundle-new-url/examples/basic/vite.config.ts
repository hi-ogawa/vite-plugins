import { vitePluginPreBundleNewUrl } from "@hiogawa/vite-plugin-pre-bundle-new-url";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    vitePluginPreBundleNewUrl({
      // debug: true,
    }),
  ],
  worker: {
    // TODO: need to force esm?
    // [commonjs--resolver] Invalid value "iife" for option "output.format" - UMD and IIFE output formats are not supported for code-splitting builds.
    format: "es",
  },
});
