import path from "node:path";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((env) => ({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: "/src/entry-server.tsx",
      preview: path.resolve("./dist/server/index.js"),
      // mode: "ViteRuntime-no-hmr",
    }),
  ],
  build: {
    outDir: env.isSsrBuild ? "dist/server" : "dist/client",
  },
}));
