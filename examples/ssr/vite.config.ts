import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import { importDevServerPlugin } from "@hiogawa/vite-import-dev-server";
import vaviteConnect from "@vavite/connect";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((ctx) => ({
  plugins: [
    react(),
    globRoutesPlugin({ root: "/src/routes" }),
    importDevServerPlugin(),
    vaviteConnect({
      standalone: false,
      serveClientAssetsInDev: true,
      handlerEntry:
        process.env["SERVER_ENTRY"] ?? "./src/server/adapter-node.ts",
    }),
  ],
  build: {
    outDir: ctx.isSsrBuild ? "dist/server" : "dist/client",
    manifest: ".vite/manifest.json",
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
