import { vitePluginSimpleHmr } from "@hiogawa/vite-plugin-simple-hmr";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginSimpleHmr({
      include: ["**/*.tsx"],
    }),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
      mode: "ViteRuntime",
    }),
  ],
});
