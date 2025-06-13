import * as ReactServer from "@hiogawa/vite-rsc/rsc"; // React core API
import { importSsr } from "@hiogawa/vite-rsc/rsc"; // Vite specifc helper
import { Root } from "../root.tsx";

export type RscPayload = {
  root: React.ReactNode;
};

// the plugin by default assumes `rsc` entry having default export of request handler.
// however, how server entries are executed can be customized by registering
// own server handler e.g. `@cloudflare/vite-plugin`.
export default async function handler(request: Request): Promise<Response> {
  // serialize RSC
  const rscStream = ReactServer.renderToReadableStream<RscPayload>({
    root: <Root />,
  });

  // respond direct RSC stream request based on framework's convention
  // here we uses request header content-type.
  // TODO
  if (request.url.endsWith(".rsc")) {
    return new Response(rscStream, {
      headers: {
        "Content-type": "text/html",
      },
    });
  }

  // Delegate to SSR environment for html rendering.
  // The plugin provides `importSsr` helper to allow import SSR entry in RSC environment,
  // however this can be customized by implementing own runtime communication
  // e.g. `@cloudflare/vite-plugin`'s service binding.
  const { handleSsr } = await importSsr<typeof import("./entry.ssr.tsx")>();
  const htmlStream = await handleSsr(rscStream);

  // respond html
  return new Response(htmlStream, {
    headers: {
      "Content-type": "text/html",
    },
  });
}
