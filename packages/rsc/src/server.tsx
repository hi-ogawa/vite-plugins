import type { ReactFormState } from "react-dom/client";
import ReactServer from "react-server-dom-webpack/server.edge";
import {
  createClientManifest,
  createServerManifest,
  loadServerAction,
  setRequireModule,
} from "./core/server";

export { createClientManifest, createServerManifest };

export function initialize(): void {
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const references = await import(
          "virtual:vite-rsc/server-references" as any
        );
        const import_ = references.default[id];
        if (!import_) {
          throw new Error(`server reference not found '${id}'`);
        }
        return import_();
      }
    },
  });
}

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
  initialize();

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
      const action = await loadServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(
        formData,
        createServerManifest(),
      );
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  const stream = ReactServer.renderToReadableStream<RscPayload>(
    { root, formState, returnValue },
    createClientManifest(),
  );

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssrEntry = await importSsr<typeof import("./ssr")>();
  return ssrEntry.renderHtml({ stream, formState });
}

export async function importSsr<T>(): Promise<T> {
  if (import.meta.env.DEV) {
    return await __viteRscSsrRunner.import("virtual:vite-rsc/ssr-entry");
  } else {
    return await import("virtual:vite-rsc/build-ssr-entry" as any);
  }
}
