import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import unocss from "unocss/vite";
import { defineConfig } from "vite";
import { vitePluginSsrCss } from "./vite-plugin-ssr-css";

export default defineConfig((ctx) => ({
  plugins: [
    // TODO
    react() as any,
    unocss(),
    importDevServerPlugin(),
    globRoutesPlugin({ root: "/src/routes" }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
    }),
    vitePluginSsrCss({
      entry: ["./src/client/index.tsx"],
    }),
    viteNullExportPlugin({
      serverOnly: "**/server/**",
      debug: true,
    }),
  ],
  build: {
    outDir: ctx.isSsrBuild ? "dist/server" : "dist/client",
    manifest: ".vite/manifest.json", // explicit manifest path for v4/v5 compat
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
