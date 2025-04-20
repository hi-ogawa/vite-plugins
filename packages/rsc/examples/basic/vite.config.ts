import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rsc from "../../dist/extra/plugin";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    rsc({
      server: "/src/server.tsx",
      client: "/src/client.tsx",
    }),
  ],
  build: {
    minify: false,
  },
}) as any;
