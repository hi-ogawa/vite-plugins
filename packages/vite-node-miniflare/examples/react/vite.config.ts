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
    vitePluginWorkerd({
      entry: "/src/worker-entry",
      miniflare: {
        log: new Log(),
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
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
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
