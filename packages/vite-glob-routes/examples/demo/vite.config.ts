import path from "node:path";
import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import { vitePluginSsrCss } from "@hiogawa/vite-plugin-ssr-css";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
      preview: path.resolve("./dist/server/index.js"),
    }),
    vitePluginSsrCss({
      entries: ["/src/client/index"],
    }),
    viteNullExportPlugin({
      serverOnly: "**/server/**",
      debug: true,
    }),
  ],
  build: {
    outDir: ctx.isSsrBuild ? "dist/server" : "dist/client",
    manifest: true,
    sourcemap: true,
  },
  optimizeDeps: {
    // avoid pre-bundling late discovery which forces browser full reload
    // debug it by:
    //   DEBUG=vite:deps pnpm -C packages/demo dev:vite --force
    entries: ["./src/client/index.tsx", "./src/routes/**/*"],
    include: ["react-router"], // TODO: probably vite-glob-routes should add it automatically
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
}));
