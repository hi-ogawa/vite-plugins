import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginErrorOverlay(),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
    }),
  ],
}));
