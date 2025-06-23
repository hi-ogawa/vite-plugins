import * as ReactServer from "@hiogawa/vite-rsc/rsc";
import { RSC_POSTFIX, type RscPayload } from "./entry.shared";
import { Root } from "./root";

export { getStaticPaths } from "./root";

export default async function handler(request: Request): Promise<Response> {
  let url = new URL(request.url);
  let isRscRequest = false;
  if (url.pathname.endsWith(RSC_POSTFIX)) {
    isRscRequest = true;
    url.pathname = url.pathname.slice(0, -RSC_POSTFIX.length);
  }

  const rscPayload: RscPayload = { root: <Root url={url} /> };
  const rscStream = ReactServer.renderToReadableStream<RscPayload>(rscPayload);

  if (isRscRequest) {
    return new Response(rscStream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
        vary: "accept",
      },
    });
  }

  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");
  const htmlStream = await ssr.renderHtml(rscStream);

  return new Response(htmlStream, {
    headers: {
      "content-type": "text/html;charset=utf-8",
      vary: "accept",
    },
  });
}
