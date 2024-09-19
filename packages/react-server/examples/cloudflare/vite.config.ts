import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    next({
      adapter: "cloudflare",
    }),
  ],
  server: {
    watch: {
      // TODO: fix https://github.com/hi-ogawa/vite-plugins/pull/645
      ignored: ["**/.wrangler/**"],
    },
  },
});
