import rsc from "@hiogawa/vite-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    rsc({
      entries: {
        browser: "/src/client.tsx",
        rsc: "/src/server.tsx",
      },
    }),
  ],
  build: {
    minify: false,
  },
}) as any;
