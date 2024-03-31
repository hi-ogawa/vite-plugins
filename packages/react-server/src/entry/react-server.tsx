import {
  createDebug,
  objectMapKeys,
  objectMapValues,
  objectPickBy,
  tinyassert,
} from "@hiogawa/utils";
import type { RenderToReadableStreamOptions } from "react-dom/server";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import type {
  LayoutRequest,
  StreamLayoutMap,
} from "../features/router/layout-manager";
import { createLayoutContentRequest } from "../features/router/utils";
import { ejectActionId } from "../features/server-action/utils";
import { unwrapRscRequest } from "../features/server-component/utils";
import { createBundlerConfig } from "../features/use-client/react-server";
import { ReactServerDigestError, createError } from "../lib/error";
import { __global } from "../lib/global";
import { generateRouteTree, renderRouteMap } from "../lib/router";
import { encodeStreamMap, ndjsonStringifyTransform } from "../utils/stream";

const debug = createDebug("react-server:rsc");

export type ReactServerHandler = (
  ctx: ReactServerHandlerContext,
) => Promise<ReactServerHandlerResult>;

// users can extend interface
export interface ReactServerHandlerContext {
  request: Request;
}

export interface ReactServerHandlerStreamResult {
  streamMap: StreamLayoutMap;
}

export type ReactServerHandlerResult =
  | Response
  | ReactServerHandlerStreamResult;

export const handler: ReactServerHandler = async (ctx) => {
  // action
  if (ctx.request.method === "POST") {
    await actionHandler(ctx);
  }

  // check rsc-only request
  const rscOnly = unwrapRscRequest(ctx.request);
  const request = rscOnly?.request ?? ctx.request;
  const url = new URL(request.url);
  let layoutMap = createLayoutContentRequest(url.pathname);

  if (rscOnly) {
    layoutMap = objectPickBy(layoutMap, (_v, k) => rscOnly.newKeys.includes(k));
  }

  const streamMap = await render({ request, layoutMap });

  if (rscOnly) {
    const stream = encodeStreamMap(
      objectMapValues(streamMap, (v) => v.pipeThrough(new TextDecoderStream())),
    )
      .pipeThrough(ndjsonStringifyTransform())
      .pipeThrough(new TextEncoderStream());
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component; charset=utf-8",
      },
    });
  }

  return { streamMap };
};

//
// render RSC
//

async function render({
  request,
  layoutMap,
}: {
  request: Request;
  layoutMap: LayoutRequest;
}): Promise<StreamLayoutMap> {
  const result = await renderRouteMap(router.tree, request);
  const bundlerConfig = createBundlerConfig();
  return objectMapValues(layoutMap, (v) => {
    const reactNode =
      v.type === "page"
        ? result.pages[v.name]
        : v.type === "layout"
          ? result.layouts[v.name]
          : undefined;
    tinyassert(reactNode);
    return reactServerDomServer.renderToReadableStream(
      reactNode,
      bundlerConfig,
      { onError: reactServerOnError },
    );
  });
}

const reactServerOnError: RenderToReadableStreamOptions["onError"] = (
  error,
  errorInfo,
) => {
  debug("[reactServerDomServer.renderToReadableStream]", {
    error,
    errorInfo,
  });
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

  // TODO: action return value?
  await action(formData);
}
