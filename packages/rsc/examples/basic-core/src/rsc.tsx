import * as ReactServer from "@hiogawa/vite-rsc/react/rsc";
import { Root } from "./routes/root";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const stream = ReactServer.renderToReadableStream(<Root />);

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
