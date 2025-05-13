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
        ssr: "@hiogawa/vite-rsc/extra/ssr",
      },
      clientPackages: ["@mantine/core"],
    }),
  ],
  optimizeDeps: {
    include: ["@mantine/core"],
  },
  environments: {
    ssr: {
      resolve: {
        // noExternal: ["@mantine/core"],
      },
    },
  },
  build: {
    minify: false,
  },
}) as any;
