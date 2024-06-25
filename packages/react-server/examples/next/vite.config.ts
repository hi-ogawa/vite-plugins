import { vitePluginReactServerNext } from "next/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [vitePluginReactServerNext()],
});
