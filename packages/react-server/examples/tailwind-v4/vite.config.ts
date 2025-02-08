import next from "next/vite";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    next(),
    tailwindcss(),
  ],
});
