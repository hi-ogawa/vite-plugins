import { cloudflare } from "@cloudflare/vite-plugin";
import rsc, { __fix_cloudflare } from "@hiogawa/vite-rsc/plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";
import { reactRouter } from "../react-router-vite/plugin";

export default defineConfig({
  clearScreen: false,
  build: {
    minify: false,
  },
  plugins: [
    tailwindcss(),
    react(),
    reactRouter(),
    rsc({
      entries: {
        client: "./react-router-vite/entry.browser.tsx",
      },
      serverHandler: false,
    }),
    __fix_cloudflare(),
    inspect(),
    cloudflare({
      configPath: "./cf/wrangler.ssr.jsonc",
      viteEnvironment: {
        name: "ssr",
      },
      auxiliaryWorkers: [
        {
          configPath: "./cf/wrangler.rsc.jsonc",
          viteEnvironment: {
            name: "rsc",
          },
        },
      ],
    }),
  ],
  environments: {
    ssr: {
      optimizeDeps: {
        include: ["react-router"],
      },
    },
    rsc: {
      optimizeDeps: {
        include: ["react-router"],
      },
    },
  },
});
