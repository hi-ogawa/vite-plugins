import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";
import type { ViteDevServer } from "vite";

type MiddlewareOptions = {
  // allow custom head injection during runtime (e.g. passing config from server to client)
  injectToHead?: () => MaybePromise<string>;
};

type MaybePromise<T> = T | Promise<T>;

export type IndexHtmlMiddleware = ReturnType<typeof createIndexHtmlMiddleware>;

export function createIndexHtmlMiddleware({
  server,
  importIndexHtml,
}: {
  server?: ViteDevServer;
  importIndexHtml: () => Promise<{ default: string }>;
}) {
  function inner(options?: MiddlewareOptions): RequestHandler {
    return async (_ctx) => {
      let { default: html } = await importIndexHtml();

      // inject hmr client
      if (server) {
        html = await server.transformIndexHtml("/", html);
      }

      // custom
      if (options?.injectToHead) {
        html = injectToHead(html, await options.injectToHead());
      }

      return new Response(html, {
        headers: [["content-type", "text/html"]],
      });
    };
  }
  return inner;
}

// https://github.com/vitejs/vite/blob/2c38bae9458794d42eebd7f7351f5633e2fe8247/packages/vite/src/node/plugins/html.ts#L1037-L1044
function injectToHead(html: string, content: string): string {
  tinyassert(html.match(HEAD_RE));
  return html.replace(HEAD_RE, (m) => `${content}${m}`);
}

const HEAD_RE = /([ \t]*)<\/head>/i;
