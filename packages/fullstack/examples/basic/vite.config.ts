import fullstack, {
  reactHmrPreamblePlugin,
} from "@hiogawa/vite-plugin-fullstack";
// import inspect from "vite-plugin-inspect";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    react(),
    reactHmrPreamblePlugin(),
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
    },
  },
}));
