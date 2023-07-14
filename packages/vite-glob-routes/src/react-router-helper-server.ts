import { tinyassert, typedBoolean } from "@hiogawa/utils";
import { type DataRouteObject, isRouteErrorResponse } from "react-router";
import {
  type StaticHandlerContext,
  createStaticHandler,
  createStaticRouter,
} from "react-router-dom/server";
import type { Manifest } from "vite";
import {
  unwrapLoaderRequest,
  wrapLoaderResult,
} from "./react-router-helper-shared";

// why is this not exposed?
type RemixRouter = ReturnType<typeof createStaticRouter>;

type ServerRouterResult =
  | {
      type: "render";
      context: StaticHandlerContext;
      router: RemixRouter;
      statusCode: number;
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleReactRouterServer({
  routes,
  request,
  requestContext,
}: {
  routes: DataRouteObject[];
  request: Request;
  requestContext?: unknown; // provide app local context to server loader
}): Promise<ServerRouterResult> {
  const handler = createStaticHandler(routes);

  // direct server loader request handling https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-server-runtime/server.ts#L136-L139
  const loaderRequest = unwrapLoaderRequest(request);
  if (loaderRequest) {
    const loaderResult = await handler.queryRoute(loaderRequest, {
      requestContext,
    });
    return {
      type: "response",
      response: wrapLoaderResult(loaderResult),
    };
  }

  const context = await handler.query(request, { requestContext });

  // handle direct loader repsonse e.g. redirection
  if (context instanceof Response) {
    return {
      type: "response",
      response: context,
    };
  }

  return {
    type: "render",
    context,
    router: createStaticRouter(handler.dataRoutes, context),
    statusCode: getResponseStatusCode(context),
  };
}

// probe context for error status (e.g. 404)
function getResponseStatusCode(context: StaticHandlerContext): number {
  if (context.errors) {
    const errorResponses = Object.values(context.errors)
      .map((e) => isRouteErrorResponse(e) && e)
      .filter(typedBoolean);
    if (errorResponses.length) {
      return Math.max(...errorResponses.map((e) => e.status));
    }
    return 500;
  }
  return 200;
}

export function resolveManifestAssets(files: string[], manifest: Manifest) {
  const entryKeys = new Set<string>();

  function collectEnryKeysRecursive(key: string) {
    if (!entryKeys.has(key)) {
      const e = manifest[key];
      tinyassert(e);
      entryKeys.add(key);
      for (const nextKey of e.imports ?? []) {
        collectEnryKeysRecursive(nextKey);
      }
    }
  }

  for (const file of files) {
    // strip "/"
    collectEnryKeysRecursive(file.slice(1));
  }

  return [...entryKeys].map((key) => "/" + manifest[key]!.file);
}
