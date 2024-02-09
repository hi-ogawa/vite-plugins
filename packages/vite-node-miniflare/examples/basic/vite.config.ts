import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "/src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    tinyReactVitePlugin(),
  ],
});
