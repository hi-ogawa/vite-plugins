import type { ReactFormState } from "react-dom/client";
import {
  Resources,
  createTemporaryReferenceSet,
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
  options?: { nonce?: string },
): Promise<Response> {
  initialize();

  function RscRoot() {
    return (
      <>
        <Resources nonce={options?.nonce} />
        {root}
      </>
    );
  }

  const url = new URL(request.url);
  const isAction = request.method === "POST";

  // use ?__rsc and ?__html for quick debugging
  const isRscRequest =
    (!request.headers.get("accept")?.includes("text/html") &&
      !url.searchParams.has("__html")) ||
    url.searchParams.has("__rsc");

  // TODO: error handling
  // callAction
  let returnValue: unknown | undefined;
  let formState: ReactFormState | undefined;
  let temporaryReferences: unknown | undefined;
  if (isAction) {
    const actionId = request.headers.get("x-rsc-action");
    if (actionId) {
      // client stream request
      const contentType = request.headers.get("content-type");
      const body = contentType?.startsWith("multipart/form-data")
        ? await request.formData()
        : await request.text();
      temporaryReferences = createTemporaryReferenceSet();
      const action = await loadServerAction(actionId);
      if (!action) {
        // TODO: how to handle progressive enhancement case?
        // TODO: how to handle invalid module key?
        return new Response(`Server function not found '${actionId}'`, {
          status: 404,
        });
      }
      const args = await decodeReply(body, { temporaryReferences });
      returnValue = await action.apply(null, args);
    } else {
      // progressive enhancement
      const formData = await request.formData();
      const decodedAction = await decodeAction(formData);
      const result = await decodedAction();
      formState = await decodeFormState(result, formData);
    }
  }

  const rscPayload: RscPayload = { root: <RscRoot />, formState, returnValue };
  const rscOptions = { temporaryReferences };
  const stream = renderToReadableStream<RscPayload>(rscPayload, rscOptions);

  if (isRscRequest) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component;charset=utf-8",
        vary: "accept",
      },
    });
  }

  const ssrEntry = await importSsr<typeof import("./ssr")>();
  return ssrEntry.renderHtml({
    stream,
    formState,
    options: {
      nonce: options?.nonce,
      __nojs: url.searchParams.has("__nojs"),
    },
  });
}
