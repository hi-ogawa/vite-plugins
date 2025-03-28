import type { ReactFormState } from "react-dom/client";
import ReactServer from "react-server-dom-webpack/server.edge";
import { createBundlerConfig } from "./features/client-component/server";

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

// TODO: split helpers (callAction, renderRsc, renderHtml)
export async function renderRequest(
  request: Request,
  root: React.ReactNode,
): Promise<Response> {
  const url = new URL(request.url);
  const isAction = request.method === "POST";
  const isRscRequest = url.searchParams.has("__rsc");

  // TODO: action
  if (isAction) {
    // TODO: progressive enhancement
    isRscRequest;
    request.body!;
  }

  const stream = ReactServer.renderToReadableStream<RscPayload>(
    { root },
    createBundlerConfig(),
  );

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssrRuntime = await importSsrRuntime();
  return ssrRuntime.renderHtml(stream);
}

async function importSsrRuntime(): Promise<typeof import("./ssr")> {
  if (import.meta.env.DEV) {
    return await __viteSsrRunner.import("/src/lib/ssr.ts");
  } else {
    return await import("virtual:build-ssr-entry" as any);
  }
}
