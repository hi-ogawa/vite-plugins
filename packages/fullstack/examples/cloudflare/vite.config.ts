import { cloudflare } from "@cloudflare/vite-plugin";
import fullstack from "@hiogawa/vite-plugin-fullstack";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    react(),
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
