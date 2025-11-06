import importAttributes from "@hiogawa/vite-plugin-import-attributes";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    importAttributes(),
    {
      name: 'import-bytes',
      resolveId(source, importer, options) {
        if (options.attributes["type"] === "bytes") {
        }
      },
      load(id, options) {
        // TODO
      },
    }
  ],
}));
