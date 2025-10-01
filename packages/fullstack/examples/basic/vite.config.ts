import fullstack from "@hiogawa/vite-plugin-fullstack";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [inspect(), fullstack()],
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
        rollupOptions: {
          input: {
            index: "./src/entry.server.tsx",
          },
        },
      },
    },
  },
  builder: {
    // NOTE: fullstack plugin doesn't depend on specific builder config
    // sharedConfigBuild: true,
    // sharedPlugins: true,
    async buildApp(builder) {
      // TODO: not mandatory but building ssr first allows
      //   import.meta.vite.assets({ import: "...", environment: "client" })
      // to dynamically add entries to client build.
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));
