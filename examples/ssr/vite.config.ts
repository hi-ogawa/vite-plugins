import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import importIndexHtmlPlugin from "@hiogawa/vite-import-index-html";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    importIndexHtmlPlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
    }),
  ],
  build: {
    outDir: ctx.ssrBuild ? "dist/server" : "dist/client",
    manifest: true,
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
}));
