import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rsc from "./src/lib/plugin";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    rsc({
      server: "/src/app/server.tsx",
      client: "/src/app/client.tsx",
    }),
  ],
}) as any;
