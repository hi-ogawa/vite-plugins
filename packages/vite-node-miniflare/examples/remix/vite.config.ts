import { vitePluginWorkerd } from "@hiogawa/vite-node-miniflare";
import { vitePlugin as remix } from "@remix-run/dev";
import { Log, Response as MiniflareResponse } from "miniflare";
import { defineConfig } from "vite";
import { vitePluginVirtualIndexHtml } from "../basic/vite.config";

export default defineConfig({
  clearScreen: false,
  plugins: [
    // TODO: how to avoid spawning this for remix child compiler
    vitePluginWorkerd({
      entry: "/app/worker-entry",
      miniflare: {
        log: new Log(),
        kvPersist: true,
        serviceBindings: {
          // DevServerHook is implemented via serviceBindings based rpc
          // https://github.com/remix-run/remix/blob/db4471d2e32a175abdcb907b877f9a510c735d8b/packages/remix-server-runtime/dev.ts#L37-L48
          __remixGetCriticalCss: async (request) => {
            const args: any = await request.json();
            const result = await (globalThis as any)[
              "__remix_devServerHooks"
            ].getCriticalCss(...args);
            return new MiniflareResponse(JSON.stringify({ result }));
          },
        },
      },
      wrangler: {
        configPath: "./wrangler.toml",
      },
    }),
    vitePluginVirtualIndexHtml(),
    remix(),
  ],
  environments: {
    workerd: {
      resolve: {
        noExternal: true,
        conditions: ["workerd"],
      },
      optimizeDeps: {
        include: [
          "react",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server",
          "@remix-run/server-runtime",
        ],
        esbuildOptions: {
          platform: "browser",
        },
      },
      keepProcessEnv: false,
    },
  },
});
