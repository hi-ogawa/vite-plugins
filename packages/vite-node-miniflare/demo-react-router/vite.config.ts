import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import react from "@vitejs/plugin-react";
import { Log } from "miniflare";
import { defineConfig } from "vite";
import {
  vitePluginPreBundle,
  vitePluginViteNodeMiniflare,
} from "../dist/index.js";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginPreBundle({
      include: ["react", "react/jsx-dev-runtime", "react-dom/server"],
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./src/server/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    react(),
  ],
});
