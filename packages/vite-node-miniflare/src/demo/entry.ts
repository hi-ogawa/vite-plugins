import { h, renderToString } from "@hiogawa/tiny-react";
import { App } from "./app";

// TODO: invalidation on file change
console.log("@@ importing entry.ts");

export default {
  async fetch(request: Request, _env: any) {
    const html = renderToString(h(App, { url: request.url }));
    return new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};
