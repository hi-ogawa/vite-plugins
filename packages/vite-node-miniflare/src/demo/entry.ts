import { h, renderToString } from "@hiogawa/tiny-react";
import { App } from "./app";

export default {
  async fetch(_request: Request, _env: any) {
    const html = renderToString(h(App, {}));
    return new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};
