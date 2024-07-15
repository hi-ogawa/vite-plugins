import * as serverRoutes from "virtual:server-routes";
import { createDebug, objectPick, objectPickBy } from "@hiogawa/utils";
import type { RenderToReadableStreamOptions } from "react-dom/server";
import ReactServer from "react-server-dom-webpack/server.edge";
import { createBundlerConfig } from "../features/client-component/server";
import {
  DEFAULT_ERROR_CONTEXT,
  ReactServerDigestError,
  createError,
  getErrorContext,
  isRedirectStatus,
} from "../features/error/shared";
import { handleMiddleware } from "../features/next/middleware";
import { RequestContext } from "../features/request-context/server";
import { handleApiRoutes } from "../features/router/api-route";
import {
  generateRouteModuleTree,
  getCachedRoutes,
  renderRouteMap,
} from "../features/router/server";
import { type FlightData, handleTrailingSlash } from "../features/router/utils";
import {
  createActionRedirectResponse,
  createFlightRedirectResponse,
} from "../features/server-action/redirect";
import {
  type ActionResult,
  createActionBundlerConfig,
  importServerAction,
  initializeReactServer,
  serverReferenceImportPromiseCache,
} from "../features/server-action/server";
import { unwrapStreamRequest } from "../features/server-component/utils";

const debug = createDebug("react-server:rsc");

export const router = generateRouteModuleTree(serverRoutes.default);

export type ReactServerHandler = (
  ctx: ReactServerHandlerContext,
) => Promise<ReactServerHandlerResult>;

// users can extend interface
export interface ReactServerHandlerContext {
  request: Request;
}

export interface ReactServerHandlerStreamResult {
  stream: ReadableStream<Uint8Array>;
  status: number;
  requestContext: RequestContext;
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

  const requestContext = new RequestContext(ctx.request.headers);

  // normalize stream request and extract metadata
  const { request, isStream, streamParam } = unwrapStreamRequest(ctx.request);

  if (serverRoutes.middleware) {
    const response = await handleMiddleware(
      serverRoutes.middleware,
      request,
      requestContext,
    );
    if (response) {
      if (isStream && isRedirectStatus(response.status)) {
        return createFlightRedirectResponse(response, requestContext);
      }
      return response;
    }
  }

  const handledApi = await handleApiRoutes(
    router.tree,
    ctx.request,
    requestContext,
  );
  if (handledApi) return handledApi;

  // action
  let actionResult: ActionResult | undefined;
  if (ctx.request.method === "POST") {
    actionResult = await actionHandler({
      request,
      streamActionId: streamParam?.actionId,
      requestContext,
    });
    // respond action redirect error directly
    const redirectResponse = createActionRedirectResponse({
      isStream,
      actionResult,
      requestContext,
    });
    if (redirectResponse) return redirectResponse;
  }

  // render flight stream
  const result = await renderRouteMap(router.tree, request);
  if (streamParam?.lastPathname) {
    // skip rendering shared layout which are not revalidated
    const cachedRoutes = getCachedRoutes(
      router.tree,
      streamParam.lastPathname,
      [streamParam?.revalidate, requestContext.revalidate],
    );
    result.nodeMap = objectPickBy(
      result.nodeMap,
      (_v, k) => !cachedRoutes.includes(k),
    );
  }
  const flightData: FlightData = {
    nodeMap: result.nodeMap,
    layoutContentMap: result.layoutContentMap,
    metadata: result.metadata,
    segments: result.segments,
    url: request.url,
    action: actionResult
      ? objectPick(actionResult, ["data", "error"])
      : undefined,
  };
  const stream = requestContext.run(() =>
    ReactServer.renderToReadableStream<FlightData>(
      flightData,
      createBundlerConfig(),
      {
        onError: reactServerOnError,
      },
    ),
  );

  if (isStream) {
    return new Response(stream, {
      headers: {
        ...requestContext.getResponseHeaders(),
        "content-type": "text/x-component; charset=utf-8",
      },
    });
  }

  return {
    stream,
    actionResult,
    requestContext,
    status: result.notFound ? 404 : 200,
  };
};

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
// server action
//

// https://github.com/facebook/react/blob/da69b6af9697b8042834644b14d0e715d4ace18a/fixtures/flight/server/region.js#L105
async function actionHandler({
  request,
  streamActionId,
  requestContext,
}: {
  request: Request;
  streamActionId?: string;
  requestContext: RequestContext;
}) {
  let boundAction: Function;
  if (streamActionId) {
    const contentType = request.headers.get("content-type");
    const body = contentType?.startsWith("multipart/form-data")
      ? await request.formData()
      : await request.text();
    const args = await ReactServer.decodeReply(
      body,
      createActionBundlerConfig(),
    );
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

  const result: ActionResult = {};
  try {
    result.data = await requestContext.run(() => boundAction());
  } catch (e) {
    result.error = getErrorContext(e) ?? DEFAULT_ERROR_CONTEXT;
  }
  if (result.error?.headers) {
    requestContext.mergeResponseHeaders(new Headers(result.error?.headers));
  }
  return result;
}
