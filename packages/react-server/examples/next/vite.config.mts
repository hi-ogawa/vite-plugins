import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    next({
      adapter: process.env["VERCEL"] ? "vercel-edge" : undefined,
    }),
  ],
});
