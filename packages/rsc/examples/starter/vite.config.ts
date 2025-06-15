import rsc from "@hiogawa/vite-rsc/plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

// TODO: explain

export default defineConfig({
  plugins: [
    rsc({
      // `entries` option is only a shorthand for specifying each `rollupOptions.input` below
      // > entries: { rsc, ssr, client },
      // by default, the plugin setup request handler based on `default export` of `rsc` environment `rollupOptions.input.index`.
      // this can be disabled when setting up own server handler e.g. `@cloudflare/vite-plugin`.
      // > disableServerHandler: true
    }),

    // add any of @vitejs/plugin-react-xxx plugins to enable client component HMR
    // https://github.com/vitejs/vite-plugin-react
    react(),

    // TODO
    inspect({ build: true }),
  ],
  // TODO
  environments: {
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.rsc.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.ssr.tsx",
          },
        },
      },
    },
    client: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.browser.tsx",
          },
        },
      },
    },
  },
});
