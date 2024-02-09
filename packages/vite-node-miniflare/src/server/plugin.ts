import * as httipAdapterNode from "@hattip/adapter-node/native-fetch";
import * as httipCompose from "@hattip/compose";
import {
  Miniflare,
  type MiniflareOptions,
  type Request as MiniflareRequest,
} from "miniflare";
import type { Plugin } from "vite";
import type { ViteNodeRunnerOptions, ViteNodeServerOptions } from "vite-node";
import { ViteNodeServer } from "vite-node/server";
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
}): Plugin {
  // initialize miniflare lazily on first request and
  // dispose on server close (e.g. server restart on user vite config change)
  let miniflare: Miniflare | undefined;

  return {
    name: packageName,
    apply: "serve",
    config(_config, _env) {
      return {
        appType: "custom",
        ssr: {
          // force "webworker" since Vite injects "require" banner if `target: "node"`
          // https://github.com/vitejs/vite/blob/a3008671de5b44ced2952f796219c0c4576125ac/packages/vite/src/node/optimizer/index.ts#L824-L830
          target: "webworker",
          noExternal: true,
        },
      };
    },
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
        deps: {
          // vite-node tries to externalize pre-bundled deps by default.
          // by putting non-existing cacheDir, we disable this heuristics.
          // https://github.com/vitest-dev/vitest/blob/043b78f3257b266302cdd68849a76b8ed343bba1/packages/vite-node/src/externalize.ts#L104-L106
          cacheDir: "__disable_externalizing_vite_deps",
          moduleDirectories: [],
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
}
