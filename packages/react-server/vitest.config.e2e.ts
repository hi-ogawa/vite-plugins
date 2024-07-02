import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    dir: "e2e",
    pool: "forks",
    fileParallelism: false,
  },
});
