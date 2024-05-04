import { h, renderToString } from "@hiogawa/tiny-react";
import { App } from "./app";

export default {
  async fetch(request: Request, env: any) {
    // load template
    let html: string;
    if (import.meta.env.DEV) {
      html = (await import("/index.html?raw")).default;
      html = await env.__RPC.transformIndexHtml("/", html);
    } else {
      html = (await import("/dist/client/index.html?raw")).default;
    }

    // ssr
    const ssrHtml = renderToString(h(App, { url: request.url }));
    html = html.replace("<!--@INJECT_SSR@-->", () => ssrHtml);
    return new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};
