import { type Result, tinyassert, wrapErrorAsync } from "@hiogawa/utils";
import { isRouteErrorResponse, json } from "react-router";
import type { RouterStaticHandler } from "../core/shared";
import { LOADER_HEADERS, LOADER_ROUTE_ID_PARAM } from "./shared";

export async function handleDateRequest({
  handler,
  request,
  requestContext,
  onError,
}: {
  handler: RouterStaticHandler;
  request: Request;
  requestContext?: unknown;
  onError?: (e: unknown) => void;
}): Promise<Response | undefined> {
  const loaderRequest = unwrapLoaderRequest(request);
  if (loaderRequest) {
    const loaderResult = await wrapErrorAsync(() =>
      handler.queryRoute(loaderRequest.request, {
        routeId: loaderRequest.routeId,
        requestContext,
      }),
    );
    return wrapLoaderResponse(loaderResult, { onError });
  }
  return;
}

function unwrapLoaderRequest(
  req: Request,
): { request: Request; routeId: string } | undefined {
  const url = new URL(req.url);
  const routeId = url.searchParams.get(LOADER_ROUTE_ID_PARAM);
  if (routeId) {
    url.searchParams.delete(LOADER_ROUTE_ID_PARAM);
    return {
      request: new Request(url, req),
      routeId,
    };
  }
  return;
}

// cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-server-runtime/server.ts#L127
function wrapLoaderResponse(
  result: Result<unknown, unknown>,
  options: { onError?: (e: unknown) => void },
): Response {
  let res: Response;
  try {
    res = wrapLoaderResultInner(result);
  } catch (e) {
    // https://github.com/remix-run/remix/blob/4e7f2bd55f75f489bc19316a671c9cd6e70bd930/packages/remix-server-runtime/server.ts#L186-L188
    options.onError?.(e);
    res = wrapLoaderException(e);
  }
  // explicit flag for valid data request response
  res.headers.set(LOADER_HEADERS["x-loader-response"], "1");
  return res;
}

function wrapLoaderResultInner(result: Result<unknown, unknown>): Response {
  // note that "thrown redirect response" is already caught in `handler.queryRoute`
  // https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L2748-L2764

  // exception or error response
  if (!result.ok) {
    let res = result.value;

    // handler.queryRoute can return "ErrorResponse" instance which is not "Response" instance (for example, when invalid "loader-route-id")
    // https://github.com/remix-run/remix/blob/4e7f2bd55f75f489bc19316a671c9cd6e70bd930/packages/remix-server-runtime/server.ts#L185-L190
    if (isRouteErrorResponse(res)) {
      res = json(res.data, {
        status: res.status,
        statusText: res.statusText,
      });
    }

    // exception
    if (!(res instanceof Response)) {
      throw res instanceof Error
        ? res
        : new Error("loader must throw 'Response' or 'Error'", { cause: res });
    }

    // error response
    res.headers.set(LOADER_HEADERS["x-loader-error-response"], "1");
    return res;
  }

  // for starter, we don't support auto "json" response
  const res = result.value;
  if (!(res instanceof Response)) {
    throw new Error("loader must return 'Response'", { cause: res });
  }

  // redirect response
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const headers = new Headers(res.headers);
    const location = headers.get(LOADER_HEADERS.location);
    tinyassert(location);
    headers.delete(LOADER_HEADERS.location);
    headers.set(LOADER_HEADERS["x-loader-redirect-url"], location);
    headers.set(LOADER_HEADERS["x-loader-redirect-status"], String(res.status));
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  return res;
}

function wrapLoaderException(e: unknown) {
  const error =
    e instanceof Error
      ? e
      : new Error("unknown loader request exception", { cause: e });
  if (import.meta.env.PROD) {
    error.stack = `${String(error)} [STACK REDUCTED]`;
  }
  return new Response(
    JSON.stringify({
      message: error.message,
      stack: error.stack,
    }),
    {
      status: 500,
      headers: {
        [LOADER_HEADERS["x-loader-exception"]]: "1",
        "content-type": "application/json",
      },
    },
  );
}
