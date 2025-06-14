import * as ReactServer from "@hiogawa/vite-rsc/rsc"; // React core API
import { Hydrated } from "./components/client.tsx";

// the plugin assumes `rsc` entry having default export of request handler
export default async function handler(request: Request): Promise<Response> {
  // serialize RSC
  const root = (
    <html>
      <body>
        <h1>Test</h1>
        <div>
          <Hydrated />
        </div>
      </body>
    </html>
  );
  const rscStream = ReactServer.renderToReadableStream(root);

  // respond direct RSC stream request based on framework's convention
  if (request.url.endsWith(".rsc")) {
    return new Response(rscStream, {
      headers: {
        "Content-type": "text/html",
      },
    });
  }

  // delegate to SSR environment for html rendering
  const { handleSsr } = await import.meta.viteRsc.loadSsrModule<
    typeof import("./entry.ssr.tsx")
  >("index");
  const htmlStream = await handleSsr(rscStream);

  // respond html
  return new Response(htmlStream, {
    headers: {
      "Content-type": "text/html",
    },
  });
}
