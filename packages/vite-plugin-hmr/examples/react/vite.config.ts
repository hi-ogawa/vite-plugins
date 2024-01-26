import { vitePluginHmr } from "@hiogawa/vite-plugin-hmr";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginHmr({
      include: ["**/*.tsx"],
    }),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
      useViteRuntime: true,
    }),
  ],
});
