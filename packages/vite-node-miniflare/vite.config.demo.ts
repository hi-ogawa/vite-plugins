import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "./dist/index.js";

export default defineConfig({
  clearScreen: false,
  // TODO: force required config from plugin?
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      entry: "./demo/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
  ],
});
