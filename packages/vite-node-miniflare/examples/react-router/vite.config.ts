import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { vitePluginWorkerd } from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginVirtualIndexHtml } from "../basic/vite.config";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  plugins: [
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginWorkerd({
      entry: "/src/server/worker-entry",
      miniflare: {
        log: new Log(),
        compatibilityFlags: ["nodejs_compat"],
      },
    }),
    vitePluginVirtualIndexHtml(),
  ],
  environments: {
    workerd: {
      resolve: {
        noExternal: true,
        conditions: ["workerd"],
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server",
        ],
        esbuildOptions: {
          platform: "browser",
        },
      },
      keepProcessEnv: false,
    },
  },
});
