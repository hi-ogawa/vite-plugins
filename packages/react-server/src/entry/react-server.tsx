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
  LayoutContentRequest,
  StreamLayoutContentMapping,
} from "../features/router/layout-manager";
import { createLayoutContentRequest } from "../features/router/utils";
import { ejectActionId } from "../features/server-action/utils";
import { unwrapRscRequest } from "../features/server-component/utils";
import { createBundlerConfig } from "../features/use-client/react-server";
import { ReactServerDigestError, createError } from "../lib/error";
import { __global } from "../lib/global";
import {
  generateRouteTree,
  matchRoute,
  renderMatchRoute,
  renderRoutes,
} from "../lib/router";
import { encodeStreamMap, ndjsonStringifyTransform } from "../utils/stream";

const debug = createDebug("react-server:rsc");

export type ReactServerHandler = (
  ctx: ReactServerHandlerContext,
) => Promise<ReactServerHandlerResult>;

// users can extend interface
export interface ReactServerHandlerContext {
  request: Request;
}

export type ReactServerHandlerResult =
  | Response
  | {
      stream: ReadableStream<Uint8Array>;
    };

export const handler: ReactServerHandler = async ({ request }) => {
  // TODO
  // api to manipulate response status/headers from server action/component?
  // allow mutate them via PageRouterProps?
  // also redirect?

  // action
  if (request.method === "POST") {
    await actionHandler({ request });
  }

  // check rsc-only request
  const rscOnly = unwrapRscRequest(request);

  if (rscOnly) {
    const url = new URL(request.url);
    let mapping = createLayoutContentRequest(url.pathname);
    mapping = objectPickBy(mapping, (_v, k) => rscOnly.newKeys.includes(k));
    const streamMapping = await render2({ request: rscOnly.request, mapping });
    const stream = encodeStreamMap(
      objectMapValues(streamMapping, (v) =>
        v.pipeThrough(new TextDecoderStream()),
      ),
    )
      .pipeThrough(ndjsonStringifyTransform())
      .pipeThrough(new TextEncoderStream());
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component; charset=utf-8",
      },
    });
  }

  // rsc
  const { stream } = await render({
    request: rscOnly ?? request,
  });
  if (rscOnly) {
    return new Response(stream, {
      headers: {
        "content-type": "text/x-component; charset=utf-8",
      },
    });
  }

  return { stream };
};

//
// render RSC
//

// TODO: renderLayoutMap
export async function render2({
  request,
  mapping,
}: {
  request: Request;
  mapping: LayoutContentRequest;
}): Promise<StreamLayoutContentMapping> {
  const result = await renderRoutes(router.tree, request);
  const bundlerConfig = createBundlerConfig();
  return objectMapValues(mapping, (v) => {
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

async function render({ request }: { request: Request }) {
  const result = await router.run(request);
  const stream = reactServerDomServer.renderToReadableStream(
    result.node,
    createBundlerConfig(),
    {
      onError(error, errorInfo) {
        debug("[reactServerDomServer.renderToReadableStream]", {
          error,
          errorInfo,
        });
        const serverError =
          error instanceof ReactServerDigestError
            ? error
            : createError({ status: 500 });
        return serverError.digest;
      },
    },
  );
  return { stream };
}

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

  async function run(request: Request) {
    const url = new URL(request.url);
    const match = matchRoute(url.pathname, tree);
    const node = await renderMatchRoute(request, match);
    return { node, match };
  }

  return { run, tree };
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
