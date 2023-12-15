import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
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
      entry: "./app/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
      preBundle: {
        include: [
          "react",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server.browser",
        ],
      },
    }),
    remix(),
  ],
});
