import nodeLoaderCloudflare from "@hiogawa/node-loader-cloudflare/vite";
import fullstack from "@hiogawa/vite-plugin-fullstack";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [fullstack(), nodeLoaderCloudflare()],
  environments: {
    client: {
      build: {
        outDir: "dist/client",
      },
    },
    ssr: {
      build: {
        outDir: "dist/ssr",
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
