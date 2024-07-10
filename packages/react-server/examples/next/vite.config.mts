import next from "next/vite";
import { defineConfig, transformWithEsbuild } from "vite";

export default defineConfig({
  plugins: [
    next({
      plugins: [
        {
          name: "jsx-in-js",
          async transform(code, id, _options) {
            if (!id.includes("/node_modules/") && id.endsWith(".js")) {
              return transformWithEsbuild(code, id, {
                loader: "jsx",
                jsx: "automatic",
              });
            }
          },
        },
      ],
    }),
  ],
});
