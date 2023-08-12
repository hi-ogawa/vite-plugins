import process from "node:process";
import globRoutesPlugin from "@hiogawa/vite-glob-routes";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), globRoutesPlugin({ root: "/src/routes" })],
  build: {
    outDir: "dist/client",
    manifest: true,
    sourcemap: true,
  },
  server: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  preview: process.env["PORT"]
    ? {
        port: Number(process.env["PORT"]),
        strictPort: true,
      }
    : undefined,
  clearScreen: false,
});
