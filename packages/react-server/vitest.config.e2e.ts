import { transformWithEsbuild } from "vite";
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
    watch: false,
  },
  plugins: [
    {
      // OXC doesn't support `using` yet
      // https://github.com/oxc-project/oxc/issues/9168
      name: "esbuild-transform",
      async transform(code, id, _options) {
        if (id.endsWith(".ts") && code.includes("using")) {
          const result = await transformWithEsbuild(code, id, {
            sourcemap: true,
            supported: {
              using: false,
            },
          });
          return {
            code: result.code,
            map: result.map,
          };
        }
        return;
      },
    },
  ],
});
