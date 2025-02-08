import tailwindcss from "@tailwindcss/vite";
import next from "next/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [next(), tailwindcss()],
});
