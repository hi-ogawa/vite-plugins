import { handler } from "@hiogawa/react-server/entry/ssr";

export default {
  async fetch(request: Request, env: any) {
    const response = await handler(request);
    // avoid compressoin on wrangler dev to enable streaming
    // https://github.com/cloudflare/workers-sdk/issues/6577
    if (env.LOCAL_PREVIEW) {
      let headers = response.headers;
      if (response.status === 200 && !headers.has("content-encoding")) {
        headers = new Headers(headers);
        headers.set("content-encoding", "identity");
        return new Response(response.body, { ...response, headers });
      }
    }
    return response;
  },
};
