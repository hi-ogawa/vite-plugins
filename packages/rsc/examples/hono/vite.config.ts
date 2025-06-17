import rsc from "@hiogawa/vite-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  clearScreen: false,
  plugins: [
    react(),
    rsc({
      entries: {
        client: "./src/client.tsx",
        rsc: "./src/server.tsx",
      },
      serverHandler: (url) => url.startsWith("/api/"),
    }),
  ],
  build: {
    minify: false,
  },
}) as any;
