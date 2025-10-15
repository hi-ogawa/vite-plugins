import fullstack from "@hiogawa/vite-plugin-fullstack";
import { defineConfig } from "vite";
import { frameworkPlugin } from "./src/framework/plugin";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // import("vite-plugin-inspect").then((m) => m.default()),
    frameworkPlugin(),
    fullstack(),
  ],
  optimizeDeps: {
    entries: ["./src/framework/entry.client.tsx", "./src/islands/**/*"],
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
        cssCodeSplit: false,
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
      await builder.build(builder.environments.ssr);
      await builder.build(builder.environments.client);
    },
  },
}));
