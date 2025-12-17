import { defineConfig } from "vite";

// import remixHmr from "@hiogawa/remix-hmr/vite";
import remixHmr from "../../dist/vite.js";

export default defineConfig({
  clearScreen: false,
  plugins: [remixHmr()],
});
