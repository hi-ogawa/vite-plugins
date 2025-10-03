import fullstack, {
  reactHmrPreamblePlugin,
} from "@hiogawa/vite-plugin-fullstack";
// import inspect from "vite-plugin-inspect";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    react(),
    reactHmrPreamblePlugin(),
    devtoolsJson(),
    fullstack(),
  ],
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
        rollupOptions: {
          input: {
            index: "./src/framework/entry.client.tsx",
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
