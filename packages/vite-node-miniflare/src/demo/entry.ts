import { render } from "./ssr";

export default {
  async fetch(_request: Request, _env: any) {
    const html = render();
    return new Response(html, {
      headers: {
        "content-type": "text/html",
      },
    });
  },
};
