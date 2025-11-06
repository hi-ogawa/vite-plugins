import importEnvironment from "@hiogawa/vite-plugin-import-environment";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [importEnvironment()],
}));
