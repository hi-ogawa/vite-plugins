import fs from "node:fs";
import { tinyReactVitePlugin } from "@hiogawa/tiny-react/dist/plugins/vite";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { vitePluginSimpleHmr } from "@hiogawa/vite-plugin-simple-hmr";
import { Log } from "miniflare";
import { type Plugin, type ViteDevServer, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [
    vitePluginSimpleHmr({
      include: new URL("./src/**/*.tsx", import.meta.url).pathname,
    }),
    vitePluginViteNodeMiniflare({
      debug: true,
      hmr: true,
      entry: "/src/worker-entry.ts",
      miniflareOptions(options) {
        options.log = new Log();
      },
    }),
    tinyReactVitePlugin(),
    vitePluginVirtualIndexHtml(),
  ],
});

export function vitePluginVirtualIndexHtml(): Plugin {
  let server: ViteDevServer | undefined;
  return {
    name: vitePluginVirtualIndexHtml.name,
    configureServer(server_) {
      server = server_;
    },
    resolveId(source, _importer, _options) {
      return source === "virtual:index-html" ? "\0" + source : undefined;
    },
    async load(id, _options) {
      if (id === "\0" + "virtual:index-html") {
        let html: string;
        if (server) {
          this.addWatchFile("index.html");
          html = await fs.promises.readFile("index.html", "utf-8");
          html = await server.transformIndexHtml("/", html);
        } else {
          html = await fs.promises.readFile("dist/client/index.html", "utf-8");
        }
        return `export default ${JSON.stringify(html)}`;
      }
      return;
    },
  };
}
