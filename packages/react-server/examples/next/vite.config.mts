import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [next()],
  // esbuild: {
  //   // loader: { "js": "jsx" }
  // }
  ssr: {
    noExternal: ["@hiogawa/test-deps-jsx-in-js"],
  },
});
