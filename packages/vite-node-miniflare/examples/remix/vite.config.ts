import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { vitePlugin as remix } from "@remix-run/dev";
import { Log, Response as MiniflareResponse } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  ssr: {
    resolve: {
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
    },
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "/app/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
        options.kvNamespaces = { kv: "0".repeat(32) };
        options.kvPersist = ".wrangler/state/v3/kv";
        options.serviceBindings = {
          // DevServerHook is implemented via serviceBindings based rpc
          // https://github.com/remix-run/remix/blob/db4471d2e32a175abdcb907b877f9a510c735d8b/packages/remix-server-runtime/dev.ts#L37-L48
          __remixGetCriticalCss: async (request) => {
            const args: any = await request.json();
            const result = await (globalThis as any)[
              "__remix_devServerHooks"
            ].getCriticalCss(...args);
            return new MiniflareResponse(JSON.stringify({ result }));
          },
        };
      },
    }),
    remix(),
  ],
});
