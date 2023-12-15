import {
  vitePluginPreBundle,
  vitePluginViteNodeMiniflare,
} from "@hiogawa/vite-node-miniflare";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginPreBundle({
      include: ["react", "react/jsx-dev-runtime", "react-dom/server"],
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/worker-entry.tsx",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react(),
  ],
});
