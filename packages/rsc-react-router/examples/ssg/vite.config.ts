import rscReactRouter from "@hiogawa/vite-rsc-react-router/plugin";
import rsc from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [tailwindcss(), react(), rscReactRouter(), rsc(), inspect()],
}) as any;
