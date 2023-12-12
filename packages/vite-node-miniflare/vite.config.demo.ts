import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "./dist/index.js";

export default defineConfig({
  clearScreen: false,
  plugins: [vitePluginViteNodeMiniflare({ entry: "./demo/server.ts" })],
  ssr: {
    noExternal: true,
  },
});
