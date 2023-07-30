import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dir: "src",
    setupFiles: ["./src/server/install-polyfill.ts"],
  },
});
