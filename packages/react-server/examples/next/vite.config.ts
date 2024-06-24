import { vitePluginReactServerNext } from "@hiogawa/react-server/next/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [react(), vitePluginReactServerNext()],
});
