import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import {
  vitePluginLogger,
  vitePluginSsrMiddleware,
} from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      prerender: async (manifest) => {
        process.env["REACT_SERVER_PRERENDER"] = "1";
        const result: string[] = [];
        for (const entry of manifest.entries) {
          if (entry.value?.page) {
            if (entry.dynamic) {
              if (entry.value.page.generateStaticParams) {
                const generated = await entry.value.page.generateStaticParams();
                for (const params of generated) {
                  result.push(entry.format(params));
                }
              }
            } else {
              result.push(entry.pathname);
            }
          }
        }
        return result;
      },
    }),
    vitePluginLogger(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("dist/server/index.js"),
    }),
  ],
});
