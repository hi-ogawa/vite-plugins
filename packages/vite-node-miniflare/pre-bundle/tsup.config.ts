import { defineConfig } from "tsup";

export default defineConfig(() => ({
  entry: [
    "src/react/index.js",
    "src/react/jsx-runtime/index.js",
    "src/react/jsx-dev-runtime/index.js",
    "src/react-dom/server/index.js",
  ],
  format: ["esm"],
  platform: "browser",
}));
