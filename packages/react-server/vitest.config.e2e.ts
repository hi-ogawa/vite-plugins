import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    supported: {
      using: false,
    },
  },
  test: {
    dir: "e2e",
    pool: "forks",
    fileParallelism: false,
  },
});
