import { createDebug, objectMapValues, objectPick } from "@hiogawa/utils";
import type { RenderToReadableStreamOptions } from "react-dom/server";
import ReactServer from "react-server-dom-webpack/server.edge";
import { handleApiRoutes } from "../features/router/api-route";
import {
  generateRouteModuleTree,
  renderRouteMap,
} from "../features/router/server";
import {
  type LayoutRequest,
  type ServerRouterData,
  handleTrailingSlash,
  revalidateLayoutContentRequest,
} from "../features/router/utils";
import { runActionContext } from "../features/server-action/context";
import {
  ActionContext,
  type ActionResult,
  createActionBundlerConfig,
  importServerAction,
  initializeReactServer,
  serverReferenceImportPromiseCache,
} from "../features/server-action/react-server";
import { unwrapStreamRequest } from "../features/server-component/utils";
import { createBundlerConfig } from "../features/use-client/react-server";
import {
  DEFAULT_ERROR_CONTEXT,
  ReactServerDigestError,
  createError,
  getErrorContext,
} from "../lib/error";

const debug = createDebug("react-server:rsc");

export type ReactServerHandler = (
  ctx: ReactServerHandlerContext,
) => Promise<ReactServerHandlerResult>;

// users can extend interface
export interface ReactServerHandlerContext {
  request: Request;
}

export interface ReactServerHandlerStreamResult {
  stream: ReadableStream<Uint8Array>;
  actionResult?: ActionResult;
}

export type ReactServerHandlerResult =
  | Response
  | ReactServerHandlerStreamResult;

export const handler: ReactServerHandler = async (ctx) => {
  initializeReactServer();

  if (import.meta.env.DEV) {
    serverReferenceImportPromiseCache.clear();
  }

  const handled = handleTrailingSlash(new URL(ctx.request.url));
  if (handled) return handled;

  const handledApi = await handleApiRoutes(router.tree, ctx.request);
  if (handledApi) return handledApi;

  // extract stream request details
  const { url, request, isStream, streamParam } = unwrapStreamRequest(
    ctx.request,
  );

  // action
  let actionResult: ActionResult | undefined;
  if (ctx.request.method === "POST") {
    actionResult = await actionHandler({
      request,
      streamActionId: streamParam?.actionId,
    });
  }

  const layoutRequest = revalidateLayoutContentRequest(
    url.pathname,
    streamParam?.lastPathname,
    [streamParam?.revalidate, actionResult?.context.revalidate],
  );
  const stream = await render({ request, layoutRequest, actionResult });

  if (isStream) {
    return new Response(stream, {
      headers: {
        ...actionResult?.responseHeaders,
        "content-type": "text/x-component; charset=utf-8",
      },
    });
  }

  return { stream, actionResult };
};

//
// render RSC
//

async function render({
  request,
  layoutRequest,
  actionResult,
}: {
  request: Request;
  layoutRequest: LayoutRequest;
  actionResult?: ActionResult;
}) {
  const result = await renderRouteMap(router.tree, request);
  const nodeMap = objectMapValues(
    layoutRequest,
    (v) => result[`${v.type}s`][v.name],
  );
  const bundlerConfig = createBundlerConfig();
  return ReactServer.renderToReadableStream<ServerRouterData>(
    {
      layout: nodeMap,
      metadata: result.metadata,
      params: result.params,
      url: request.url,
      action: actionResult
        ? objectPick(actionResult, ["data", "error"])
        : undefined,
    },
    bundlerConfig,
    {
      onError: reactServerOnError,
    },
  );
}

const reactServerOnError: RenderToReadableStreamOptions["onError"] = (
  error,
  errorInfo,
) => {
  debug("[reactServerDomServer.renderToReadableStream]", {
    error,
    errorInfo,
  });
  if (!(error instanceof ReactServerDigestError)) {
    console.error("[react-server:renderToReadableStream]", error);
  }
  const serverError =
    error instanceof ReactServerDigestError
      ? error
      : createError({ status: 500 });
  return serverError.digest;
};

//
// glob import routes
//

// @ts-ignore untyped virtual
import serverRoutes from "virtual:server-routes";

export const router = generateRouteModuleTree(serverRoutes);

//
// server action
//

// https://github.com/facebook/react/blob/da69b6af9697b8042834644b14d0e715d4ace18a/fixtures/flight/server/region.js#L105
async function actionHandler({
  request,
  streamActionId,
}: { request: Request; streamActionId?: string }) {
  const context = new ActionContext(request);
  let boundAction: Function;
  if (streamActionId) {
    const contentType = request.headers.get("content-type");
    const body = contentType?.startsWith("multipart/form-data")
      ? await request.formData()
      : await request.text();
    const args = await ReactServer.decodeReply(body);
    const action = await importServerAction(streamActionId);
    boundAction = () => action.apply(null, args);
  } else {
    const formData = await request.formData();
    const decodedAction = await ReactServer.decodeAction(
      formData,
      createActionBundlerConfig(),
    );
    boundAction = async () => {
      const result = await decodedAction();
      const formState = await ReactServer.decodeFormState(result, formData);
      return formState;
    };
  }

  const result: ActionResult = { context };
  try {
    result.data = await runActionContext(context, () => boundAction());
  } catch (e) {
    result.error = getErrorContext(e) ?? DEFAULT_ERROR_CONTEXT;
  } finally {
    result.responseHeaders = {
      ...context.responseHeaders,
      ...result.error?.headers,
    };
  }
  return result;
}
