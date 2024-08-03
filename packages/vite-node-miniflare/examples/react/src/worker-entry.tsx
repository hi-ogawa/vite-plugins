import ReactDomServer from "react-dom/server";
import { App } from "./app";

export default {
  async fetch(request: Request, _env: any) {
    // load template
    let html: string = (await import("virtual:index-html" as string)).default;

    // ssr
    const ssrHtml = ReactDomServer.renderToString(<App url={request.url} />);
    html = html.replace("<!--@INJECT_SSR@-->", () => ssrHtml);
    return new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};
