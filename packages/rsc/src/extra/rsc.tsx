import type { ReactFormState } from "react-dom/client";
import {
  decodeAction,
  decodeFormState,
  decodeReply,
  importSsr,
  initialize,
  loadServerAction,
  renderToReadableStream,
} from "../rsc";

export type RscPayload = {
  root: React.ReactNode;
  formState?: ReactFormState;
  returnValue?: unknown;
};

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
      const args = await decodeReply(body);
      const action = await loadServerAction(actionId);
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await decodeAction(formData);
      const result = await decodedAction();
      formState = await decodeFormState(result, formData);
    }
  }

  const stream = renderToReadableStream<RscPayload>({
    root,
    formState,
    returnValue,
  });

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
