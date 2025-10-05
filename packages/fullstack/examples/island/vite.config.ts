import fullstack from "@hiogawa/vite-plugin-fullstack";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";
import { islandPlugin } from "./src/framework/island/plugin";
// import inspect from "vite-plugin-inspect";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    preact(),
    islandPlugin(),
    fullstack(),
  ],
  optimizeDeps: {
    entries: ["./src/framework/entry.client.tsx", "./src/components/**/*"],
  },
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        rollupOptions: {
          input: {
            index: "./src/framework/entry.server.tsx",
          },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.ssr);
      await builder.build(builder.environments.client);
    },
  },
}));
