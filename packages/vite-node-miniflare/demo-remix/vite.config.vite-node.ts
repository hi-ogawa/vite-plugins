import {
  vitePluginPreBundle,
  vitePluginViteNodeMiniflare,
} from "@hiogawa/vite-node-miniflare";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    vitePluginPreBundle({
      include: ["react", "react/jsx-dev-runtime", "react-dom/server.browser"],
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./app/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    remix(),
  ],
  ssr: {
    noExternal: true,
  },
});
