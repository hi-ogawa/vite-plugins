import * as ReactServer from "@hiogawa/vite-rsc/react/rsc";
import type React from "react";
import type { ReactFormState } from "react-dom/client";
import { Root } from "./routes/root";

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

export default async function handler(request: Request): Promise<Response> {
  ReactServer.setRequireModule({
    load(id) {
      return import(/* @vite-ignore */ id);
    },
  });

  const url = new URL(request.url);
  const isAction = request.method === "POST";

  // override with ?__rsc and ?__html for quick debugging
  const isRscRequest =
    (!request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("__html")) ||
    url.searchParams.has("__rsc");

  // action
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
      const action = await ReactServer.loadServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await ReactServer.decodeAction(formData);
      const result = await decodedAction();
      formState = await ReactServer.decodeFormState(result, formData);
    }
  }

  const stream = ReactServer.renderToReadableStream<RscPayload>({
    root: <Root />,
    formState,
    returnValue,
  });

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "Content-Type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssr = await importSsr();
  const htmlStream = await ssr.renderHtml({ url, stream, formState });
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
