import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { vitePluginSimpleHmr } from "@hiogawa/vite-plugin-simple-hmr";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    // stacktrace is different even if my hmr plugin is removed
    false && vitePluginSimpleHmr({
      include: new URL("./src/**/*.tsx", import.meta.url).pathname,
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      hmr: true,
      entry: "/src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    tinyReactVitePlugin(),
  ],
});
