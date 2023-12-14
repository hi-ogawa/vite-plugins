import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      // TODO: must be a relative url for invalidation to work?
      entry: "./src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    tinyReactVitePlugin(),
  ],
});
