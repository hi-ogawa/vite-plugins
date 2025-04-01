import "./features/server-function/server-init";
import type { ReactFormState } from "react-dom/client";
import ReactServer from "react-server-dom-webpack/server.edge";
import { createBundlerConfig } from "./features/client-component/server";
import {
  createActionBundlerConfig,
  importServerAction,
} from "./features/server-function/server";

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

// TODO: split helpers like parcel (callAction, renderRsc, renderHtml)
export async function renderRequest(
  request: Request,
  root: React.ReactNode,
): Promise<Response> {
  const url = new URL(request.url);
  const isAction = request.method === "POST";

  // use ?__rsc and ?__html for quick debugging
  const isRscRequest =
    (!request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("__html")) ||
    url.searchParams.has("__rsc");

  // callAction
  let returnValue: unknown | undefined;
  let formState: ReactFormState | undefined;
  if (isAction) {
    const actionId = request.headers.get("x-rsc-action");
    if (actionId) {
      // client stream request
      const contentType = request.headers.get("content-type");
      const body = contentType?.startsWith("multipart/form-data")
        ? await request.formData()
        : await request.text();
      const args = await ReactServer.decodeReply(body);
      const action = await importServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(
        formData,
        createActionBundlerConfig(),
      );
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  const stream = ReactServer.renderToReadableStream<RscPayload>(
    { root, formState, returnValue },
    createBundlerConfig(),
  );

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssrEntry = await importSsrEntry();
  return ssrEntry.renderHtml(stream);
}

// const rscEntry = importRscEnvironment<typeof import("./src/server.tsx")>("/src/server.tsx");
// rscEntry.handlerRsc(request, root)

// TODO: replace with virtual/vite-rsc:ssr-entry
async function importSsrEntry(): Promise<typeof import("./ssr")> {
  if (import.meta.env.DEV) {
    return await __viteRscSsrRunner.import("virtual:ssr-entry");
  } else {
    return await import("virtual:build-ssr-entry" as any);
  }
}


// export async function importSsrLayer() {
//   if (import.meta.env.DEV) {
//     return await __viteRscSsrRunner.import("virtual:vite-rsc/ssr-layer");
//   } else {
//     return await import("virtual:vite-rsc/ssr-layer" as any);
//   }
// }
