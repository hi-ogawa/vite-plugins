import { cloudflare } from "@cloudflare/vite-plugin";
import fullstack, {
  reactHmrPreamblePlugin,
} from "@hiogawa/vite-plugin-fullstack";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    react(),
    reactHmrPreamblePlugin(),
    fullstack({
      serverHandler: false,
    }),
    cloudflare({
      viteEnvironment: {
        name: "ssr",
      },
    }),
  ],
  optimizeDeps: {
    entries: ["./src/entry.client.tsx"],
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
