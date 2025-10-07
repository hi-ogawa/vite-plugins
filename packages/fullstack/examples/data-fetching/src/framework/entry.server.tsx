import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { RPCHandler } from "@orpc/server/fetch";
import { renderToReadableStream } from "react-dom/server.edge";
import { App } from "../app";
import serverAssets from "../app?assets=ssr";
import { __rpc_router__ } from "../rpc";
import clientAssets from "./entry.client.tsx?assets=client";
import "./rpc.server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const rpcHandler = new RPCHandler(__rpc_router__);
const assets = mergeAssets(clientAssets, serverAssets);

async function handler(request: Request): Promise<Response> {
  const rpcResult = await rpcHandler.handle(request, { prefix: "/rpc" });
  if (rpcResult.matched) {
    return rpcResult.response;
  }

  // TODO: hydrate client
  const queryClient = new QueryClient();

  function SsrRoot() {
    const head = (
      <>
        {assets.js.map((attrs) => (
          <link
            {...attrs}
            rel="modulepreload"
            key={attrs.href}
            crossOrigin=""
          />
        ))}
        {assets.css.map((attrs) => (
          <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
        ))}
      </>
    );
    return (
      <>
        {head}
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </>
    );
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: `import(${JSON.stringify(clientAssets.entry)})`,
  });

  return new Response(htmlStream, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
    },
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
