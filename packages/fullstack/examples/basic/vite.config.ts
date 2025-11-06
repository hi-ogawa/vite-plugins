import fullstack from "@hiogawa/vite-plugin-fullstack";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // import("vite-plugin-inspect").then((m) => m.default()),
    react(),
    fullstack(),
  ],
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
      },
      // excplit rollupOptions.input is not necessary,
      // but `optimizeDeps.entries` is still desired to set.
      optimizeDeps: {
        entries: ["./src/entry.client.tsx"],
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
      await builder.writeAssetsManifest();
    },
  },
}));
