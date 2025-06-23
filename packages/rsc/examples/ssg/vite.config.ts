import path from "node:path";
import { pathToFileURL } from "node:url";
import rsc from "@hiogawa/vite-rsc/plugin";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  plugins: [
    mdx(),
    react(),
    rsc({
      entries: {
        client: "./src/entry.browser.tsx",
        rsc: "./src/entry.rsc.tsx",
        ssr: "./src/entry.ssr.tsx",
      },
    }),
    rscSsgPlugin(),
    inspect(),
  ],
});

function rscSsgPlugin(): Plugin[] {
  return [
    {
      name: "rsc-ssg",
      // use post ssr writeBundle to wait for app is fully built
      // TODO: on Vite 7, it's possible to use post `buildApp` hook.
      writeBundle: {
        order: "post",
        async handler(options, bundle) {
          if (this.environment.name === "ssr") {
            const config = this.environment.getTopLevelConfig();
            const entryPath = path.join(
              config.environments.rsc.build.outDir,
              "index.js",
            );
            const entry: typeof import("./src/entry.rsc") = await import(
              pathToFileURL(entryPath).href
            );
            entry.getStaticPaths;
            entry.default;
            options;
            bundle;
          }
        },
      },
    },
  ];
}
