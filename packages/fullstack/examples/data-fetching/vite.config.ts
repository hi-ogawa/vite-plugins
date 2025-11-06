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
  optimizeDeps: {
    entries: ["src/framework/entry.client.tsx"],
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
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
