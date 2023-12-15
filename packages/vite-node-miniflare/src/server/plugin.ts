import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import { typedBoolean } from "@hiogawa/utils";
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
      const miniflareHandler: httipCompose.RequestHandler = async (ctx) => {
        if (!miniflare) {
          const viteNodeRunnerOptions: Partial<ViteNodeRunnerOptions> = {
            root: server.config.root,
            base: server.config.base,
            debug: !!pluginOptions.debug,
          };
          pluginOptions.viteNodeRunnerOptions?.(viteNodeRunnerOptions);

          const miniflareOptions = viteNodeServerRpc.generateMiniflareOptions({
            entry: pluginOptions.entry,
            rpcOrigin: ctx.url.origin,
            debug: pluginOptions.debug,
            viteNodeRunnerOptions,
          });
          pluginOptions.miniflareOptions?.(miniflareOptions);
          miniflare = new Miniflare(miniflareOptions);
          await miniflare.ready;
        }

        // workaround typing mismatch between "lib.dom" and "miniflare"
        const request = ctx.request as any as MiniflareRequest;
        return miniflare.dispatchFetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          duplex: "half",
        }) as any as Response;
      };

      const middleware = httipAdapterNode.createMiddleware(
        httipCompose.compose(
          viteNodeServerRpc.requestHandler,
          miniflareHandler
        ),
        {
          alwaysCallNext: false,
        }
      );
      return () => server.middlewares.use(middleware);
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
