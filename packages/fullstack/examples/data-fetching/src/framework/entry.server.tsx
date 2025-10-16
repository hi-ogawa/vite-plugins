import { RPCHandler } from "@orpc/server/fetch";
import { renderToReadableStream } from "react-dom/server.edge";
import { App } from "../app";
import serverAssets from "../app?assets=ssr";
import { __rpc_router__ } from "../rpc";
import clientAssets from "./entry.client.tsx?assets=client";
import "./rpc.server";
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
} from "@tanstack/react-query";

const rpcHandler = new RPCHandler(__rpc_router__);
const assets = clientAssets.merge(serverAssets);

async function handler(request: Request): Promise<Response> {
  const rpcResult = await rpcHandler.handle(request, { prefix: "/rpc" });
  if (rpcResult.matched) {
    return rpcResult.response;
  }

  const queryClient = new QueryClient();

  // prefetch query
  await queryClient.ensureQueryData($rpcq.listItems.queryOptions());

  // bootstrap script to hydrate react-query state on the client
  const dehydratedState = dehydrate(queryClient);
  const bootstrapScriptContent = `\
self.__query_client_dehydrated_state=${escapeHtml(JSON.stringify(dehydratedState))};
import(${JSON.stringify(clientAssets.entry)});
`;

  function SsrRoot() {
    return (
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
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </>
    );
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent,
  });

  return new Response(htmlStream, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
    },
  });
}

// https://github.com/remix-run/react-router/blob/6ff0bb35db54535b3436375784fd40225a3664c2/packages/react-router/lib/dom/ssr/markup.ts#L15-L20
const ESCAPE_LOOKUP: { [match: string]: string } = {
  "&": "\\u0026",
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

function escapeHtml(html: string) {
  return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
