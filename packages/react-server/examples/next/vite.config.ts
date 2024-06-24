import { vitePluginReactServerNext } from "@hiogawa/react-server-next/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [vitePluginReactServerNext()],
});
