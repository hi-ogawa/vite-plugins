import * as ReactServer from "@hiogawa/vite-rsc/react/rsc";
import { ClientCounter, Hydrated } from "./client";

function Document() {
  return (
    <html>
      <head>
        <title>vite-rsc</title>
      </head>
      <body className="flex flex-col gap-2 items-start p-2">
        <h4 className="text-xl">Test</h4>
        <div>
          <Hydrated />
        </div>
        <ClientCounter />
      </body>
    </html>
  );
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const root = <Document />;
  const stream = ReactServer.renderToReadableStream(root);

  if (url.search.includes("__rsc")) {
    return new Response(stream, {
      headers: {
        "Content-Type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssr = await importSsr();
  const htmlStream = await ssr.renderHtml({ stream });
  return new Response(htmlStream, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
    },
  });
}

async function importSsr(): Promise<typeof import("./ssr")> {
  // console.log("[viteSsrRunner.import]");
  return (globalThis as any).__viteSsrRunner.import("/src/ssr.tsx");
}
