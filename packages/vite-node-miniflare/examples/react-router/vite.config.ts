import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  ssr: {
    resolve: {
      conditions: ["workerd"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server",
      ],
    },
  },
  plugins: [
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "/src/server/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
        options.compatibilityFlags = ["nodejs_compat"];
      },
    }),
    react(),
  ],
});
