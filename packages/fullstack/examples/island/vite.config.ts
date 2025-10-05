import fullstack from "@hiogawa/vite-plugin-fullstack";
import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    fullstack(),
    preact(),
  ],
  optimizeDeps: {
    entries: ["./src/entry.client.tsx", "./src/components/**/*"],
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
            index: "./src/entry.server.tsx",
          },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
