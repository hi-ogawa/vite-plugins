import fullstack from "@hiogawa/vite-plugin-fullstack";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // import("vite-plugin-inspect").then((m) => m.default()),
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
      await builder.writeAssetsManifest();
    },
  },
}));

// waiting for https://github.com/vitejs/vite-plugin-react/pull/890
function reactHmrPreamblePlugin(): Plugin[] {
  return [
    {
      name: "react-hmr-preamble",
      resolveId: (id) =>
        id === "virtual:react-hmr-preamble" ? "\0" + id : null,
      load: (id) =>
        id === "\0virtual:react-hmr-preamble"
          ? react.preambleCode.replace("__BASE__", "/")
          : null,
    },
  ];
}
