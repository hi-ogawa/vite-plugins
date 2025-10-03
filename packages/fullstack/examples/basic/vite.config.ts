import fullstack, {
  reactHmrPreamblePlugin,
} from "@hiogawa/vite-plugin-fullstack";
// import inspect from "vite-plugin-inspect";
// import { cloudflare } from "@cloudflare/vite-plugin";
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
      // NOTE:
      // dynamically adding entry is supported only when building ssr -> client.
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
