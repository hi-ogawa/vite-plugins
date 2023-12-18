import { typedBoolean } from "@hiogawa/utils";
import * as h3 from "h3";
import {
  Miniflare,
  type MiniflareOptions,
  type Request as MiniflareRequest,
} from "miniflare";
import type { Plugin } from "vite";
import type { ViteNodeRunnerOptions, ViteNodeServerOptions } from "vite-node";
import { ViteNodeServer } from "vite-node/server";
import { vitePluginPreBundle } from "..";
import { name as packageName } from "../../package.json";
import { setupViteNodeServerRpc } from "./vite-node";

export function vitePluginViteNodeMiniflare(pluginOptions: {
  entry: string;
  debug?: boolean;
  // hooks to customize options
  miniflareOptions?: (options: MiniflareOptions) => void;
  viteNodeServerOptions?: (options: ViteNodeServerOptions) => void;
  viteNodeRunnerOptions?: (options: Partial<ViteNodeRunnerOptions>) => void;
  preBundle?: {
    include: string[];
    force?: boolean;
  };
  customRpc?: Record<string, Function>;
}): Plugin[] {
  // initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change)
  let miniflare: Miniflare | undefined;

  const middlewarePlugin: Plugin = {
    name: packageName,
    apply: "serve",
    async configureServer(server) {
      // setup vite-node with rpc
      const viteNodeServerOptions: ViteNodeServerOptions = {
        debug: {
          dumpModules: pluginOptions.debug,
        },
        // I thought this is always the case, but somehow maybe not for virtual modules?
        // Without this, Remix's "remix-dot-server" plugin will trigger errors.
        transformMode: {
          ssr: [/.*/],
        },
      };
      pluginOptions.viteNodeServerOptions?.(viteNodeServerOptions);
      const viteNodeServer = new ViteNodeServer(server, viteNodeServerOptions);
      const viteNodeServerRpc = setupViteNodeServerRpc(viteNodeServer, {
        customRpc: pluginOptions.customRpc,
      });

      // setup miniflare + proxy
      // TODO: proxy `wrangler.unstable_dev` to make use of wrangler.toml?
      const miniflareHandler = h3.eventHandler(async (event) => {
        const url = h3.getRequestURL(event);

        if (!miniflare) {
          const viteNodeRunnerOptions: Partial<ViteNodeRunnerOptions> = {
            root: server.config.root,
            base: server.config.base,
            debug: !!pluginOptions.debug,
          };
          pluginOptions.viteNodeRunnerOptions?.(viteNodeRunnerOptions);

          const miniflareOptions = viteNodeServerRpc.generateMiniflareOptions({
            entry: pluginOptions.entry,
            rpcOrigin: url.origin,
            debug: pluginOptions.debug,
            viteNodeRunnerOptions,
          });
          pluginOptions.miniflareOptions?.(miniflareOptions);
          miniflare = new Miniflare(miniflareOptions);
          await miniflare.ready;
        }

        // workaround Request/Response polyfills mismatch and typings mismatch between "lib.dom" and "miniflare"
        const request = h3.toWebRequest(event) as any as MiniflareRequest;
        const res = await miniflare.dispatchFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: "half",
        });
        return new Response(res.body as any, {
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
      });

      const app = h3.createApp().use([
        h3.eventHandler((event) => {
          // workaround double toWebRequest? https://github.com/unjs/h3/issues/570
          event.web = {
            request: h3.toWebRequest(event),
          };
          return viteNodeServerRpc.requestHandler({
            request: h3.toWebRequest(event),
          });
        }),
        miniflareHandler,
      ]);

      return () => server.middlewares.use(h3.toNodeListener(app));
    },

    async buildEnd() {
      if (miniflare) {
        await miniflare.dispose();
        miniflare = undefined;
      }
    },
  };

  return [
    middlewarePlugin,
    pluginOptions.preBundle && vitePluginPreBundle(pluginOptions.preBundle),
  ].filter(typedBoolean);
}
