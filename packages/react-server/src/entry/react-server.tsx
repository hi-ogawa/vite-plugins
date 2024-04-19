import {
  createDebug,
  objectMapKeys,
  objectMapValues,
  objectPick,
} from "@hiogawa/utils";
import type { RenderToReadableStreamOptions } from "react-dom/server";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import {
  type LayoutRequest,
  type ServerRouterData,
} from "../features/router/utils";
import {
  ActionContext,
  type ActionResult,
  createActionBundlerConfig,
  importServerAction,
  initializeWebpackReactServer,
} from "../features/server-action/react-server";
import { unwrapStreamActionRequest } from "../features/server-action/utils";
import { unwrapStreamRequest } from "../features/server-component/utils";
import { createBundlerConfig } from "../features/use-client/react-server";
import {
  DEFAULT_ERROR_CONTEXT,
  ReactServerDigestError,
  createError,
  getErrorContext,
} from "../lib/error";
import { generateRouteTree, renderRouteMap } from "../lib/router";

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
  initializeWebpackReactServer();

  // action
  let actionResult: ActionResult | undefined;
  if (ctx.request.method === "POST") {
    actionResult = await actionHandler(ctx);
  }

  // check stream only request
  const { request, layoutRequest, isStream } = unwrapStreamRequest(
    ctx.request,
    actionResult,
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
  return reactServerDomServer.renderToReadableStream<ServerRouterData>(
    {
      layout: nodeMap,
      action: actionResult
        ? objectPick(actionResult, ["id", "data", "error"])
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

const router = createRouter();

function createRouter() {
  // for now hard code /src/routes as convention
  const glob = import.meta.glob(
    "/src/routes/**/(page|layout|error).(js|jsx|ts|tsx)",
    {
      eager: true,
    },
  );
  const tree = generateRouteTree(
    objectMapKeys(glob, (_v, k) => k.slice("/src/routes".length)),
  );

  return { tree };
}

//
// server action
//

// https://github.com/facebook/react/blob/da69b6af9697b8042834644b14d0e715d4ace18a/fixtures/flight/server/region.js#L105
async function actionHandler({ request }: { request: Request }) {
  const context = new ActionContext(request);
  const streamAction = unwrapStreamActionRequest(request);
  let boundAction: Function;
  let id: string | undefined;
  if (streamAction) {
    const formData = await request.formData();
    const args = await reactServerDomServer.decodeReply(formData);
    const action = await importServerAction(streamAction.id);
    id = streamAction.id;
    boundAction = () => action.apply(context, args);
  } else {
    // TODO: cannot bind context
    // TODO: decodeFormState
    const formData = await request.formData();
    boundAction = await reactServerDomServer.decodeAction(
      formData,
      createActionBundlerConfig(),
    );
  }

  const result: ActionResult = { id, context };
  try {
    result.data = await boundAction();
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
