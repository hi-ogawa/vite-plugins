import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { Log } from "miniflare";
import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginViteNodeMiniflare({
      debug: true,
      entry: "./app/worker-entry-wrapper.ts",
      miniflareOptions(options) {
        options.log = new Log();
        // @ts-ignore why type error
        options.kvNamespaces = { kv: "0".repeat(32) };
        options.kvPersist = ".wrangler/state/v3/kv";
      },
      preBundle: {
        include: [
          "react",
          "react/jsx-dev-runtime",
          "react-dom",
          "react-dom/server.browser",
        ],
      },
      customRpc: {
        // DevServerHook is implemented via custom rpc
        // https://github.com/remix-run/remix/blob/db4471d2e32a175abdcb907b877f9a510c735d8b/packages/remix-server-runtime/dev.ts#L37-L48
        __remixGetCriticalCss: (...args: any[]) => {
          return globalThis["__remix_devServerHooks"].getCriticalCss(...args);
        },
      },
    }),
    remix(),
  ],
});
