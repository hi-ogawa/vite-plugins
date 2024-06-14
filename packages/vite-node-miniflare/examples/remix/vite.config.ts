import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { vitePlugin as remix } from "@remix-run/dev";
import { Log } from "miniflare";
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
      },
      customRpc: {
        // DevServerHook is implemented via custom rpc
        // https://github.com/remix-run/remix/blob/db4471d2e32a175abdcb907b877f9a510c735d8b/packages/remix-server-runtime/dev.ts#L37-L48
        __remixGetCriticalCss: (...args: any[]) => {
          return (globalThis as any)["__remix_devServerHooks"].getCriticalCss(
            ...args,
          );
        },
      },
    }),
    remix(),
  ],
});
