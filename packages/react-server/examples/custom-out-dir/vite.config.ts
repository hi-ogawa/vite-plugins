import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    next({
      outDir: process.env.VITE_E2E_OUT_DIR || "custom-out-dir",
    }),
  ],
});
