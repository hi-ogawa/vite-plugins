import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    tailwindcss(),
    react(),
    rsc({
      entries: {
        browser: "/src/entry.browser.tsx",
        ssr: "/src/entry.ssr.tsx",
        rsc: "/src/entry.rsc.tsx",
      },
    }),
  ],
  optimizeDeps: {
    include: ["react-router"],
  },
}) as any;
