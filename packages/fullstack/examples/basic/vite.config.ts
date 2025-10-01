import fullstack from "@hiogawa/vite-plugin-fullstack";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [inspect(), fullstack()],
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
        rollupOptions: {
          input: {
            index: "./src/entry.client.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        emitAssets: true,
        rollupOptions: {
          input: {
            index: "./src/entry.server.tsx",
          },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      // NOTE: support any build order
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
