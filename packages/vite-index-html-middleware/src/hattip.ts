// @ts-expect-error
import internal from "/virtual:@hiogawa/vite-index-html-middleware/internal";
import type { RequestHandler } from "@hattip/compose";
import { tinyassert } from "@hiogawa/utils";

type Options = {
  // allow custom head injection during runtime (e.g. passing config from server to client)
  injectToHead?: () => string | Promise<string>;
};

export function indexHtmlMiddleware(options?: Options): RequestHandler {
  const { server, importIndexHtml } = internal;

  return async () => {
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

// https://github.com/vitejs/vite/blob/2c38bae9458794d42eebd7f7351f5633e2fe8247/packages/vite/src/node/plugins/html.ts#L1037-L1044
function injectToHead(html: string, content: string): string {
  tinyassert(html.match(HEAD_RE));
  return html.replace(HEAD_RE, (m) => `${content}${m}`);
}

const HEAD_RE = /([ \t]*)<\/head>/i;
