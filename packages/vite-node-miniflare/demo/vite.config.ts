import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  // TODO: force required config from plugin?
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      entry: "./src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    // for hmr
    tinyReactVitePlugin(),
  ],
});
