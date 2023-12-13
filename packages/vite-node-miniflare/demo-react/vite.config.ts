import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/server.browser",
      ],
    },
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      entry: "./src/worker-entry.tsx",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react(),
  ],
});
