import nodeLoaderCloudflare from "@hiogawa/node-loader-cloudflare/vite";
import fullstack from "@hiogawa/vite-plugin-fullstack";
import { defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [fullstack(), nodeLoaderCloudflare()],
  optimizeDeps: {
    entries: ["./src/client/main.tsx"],
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./src/entry.server.tsx",
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
