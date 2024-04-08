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
} from "../features/server-action/react-server";
import { ejectActionId } from "../features/server-action/utils";
import { unwrapStreamRequest } from "../features/server-component/utils";
import { createBundlerConfig } from "../features/use-client/react-server";
import {
  DEFAULT_ERROR_CONTEXT,
  ReactServerDigestError,
  createError,
  getErrorContext,
} from "../lib/error";
import { __global } from "../lib/global";
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
    if (import.meta.env.DEV && error instanceof Error) {
      __global.dev.server.hot.send({
        type: "error",
        err: {
          message: error.message,
          stack: error.stack ?? "",
        },
      });
    }
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

async function actionHandler({ request }: { request: Request }) {
  const formData = await request.formData();
  if (0) {
    // TODO: proper decoding?
    await reactServerDomServer.decodeReply(formData);
  }
  const id = ejectActionId(formData);

  let action: Function;
  const [file, name] = id.split("::") as [string, string];
  if (import.meta.env.DEV) {
    const mod: any = await __global.dev.reactServer.ssrLoadModule(file);
    action = mod[name];
  } else {
    // include all "use server" files via virtual module on build
    const virtual = await import("virtual:rsc-use-server" as string);
    const mod = await virtual.default[file]();
    action = mod[name];
  }

  const context = new ActionContext(request);
  const result: ActionResult = { id, context };
  try {
    result.data = await action.apply(context, [formData]);
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
