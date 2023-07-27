import { type Result, arrayToEnum, tinyassert } from "@hiogawa/utils";

//
// server proxy loader convention (aka data request)
//

const ENUM = arrayToEnum([
  // url param for server to tell loader request routeId cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-react/routes.tsx#L210
  // this convention might not be DX friendly since request path doesn't tell which loader is called exactly
  "x-loader-route-id",

  // redirect response
  "location",
  "x-loader-redirect-url",
  "x-loader-redirect-status",

  // error `Response`
  "x-loader-error-response", // aka x-remix-catch

  // exception (runtime server `Error` propagated to client)
  "x-loader-exception", // aka x-remix-error
]);

export function wrapLoaderRequest(req: Request, routeId: string): Request {
  const url = new URL(req.url);
  url.searchParams.set(ENUM["x-loader-route-id"], routeId);
  return new Request(url);
}

export function unwrapLoaderRequest(
  req: Request
): { request: Request; routeId: string } | undefined {
  const url = new URL(req.url);
  const routeId = url.searchParams.get(ENUM["x-loader-route-id"]);
  if (routeId) {
    url.searchParams.delete(ENUM["x-loader-route-id"]);
    return {
      request: new Request(url, req),
      routeId,
    };
  }
  return;
}

// cf. https://github.com/remix-run/remix/blob/c858f53e5a67fb293baf79a8de00c418903bc250/packages/remix-server-runtime/server.ts#L127
export function wrapLoaderResult(result: Result<unknown, unknown>): Response {
  try {
    return wrapLoaderResultInner(result);
  } catch (e) {
    return wrapLoaderException(e);
  }
}

function wrapLoaderResultInner(result: Result<unknown, unknown>): Response {
  // note that "thrown redirect response" is already caught in `handler.queryRoute`
  // https://github.com/remix-run/react-router/blob/4e12473040de76abf26e1374c23a19d29d78efc0/packages/router/router.ts#L2748-L2764

  // exception or error response
  if (!result.ok) {
    const res = result.value;
    // exception
    if (!(res instanceof Response)) {
      throw res instanceof Error
        ? res
        : new Error("loader must throw 'Response' or 'Error'");
    }
    // error response
    res.headers.set(ENUM["x-loader-error-response"], "1");
    return res;
  }

  const res = result.value;
  tinyassert(res instanceof Response, "loader must return 'Response'");

  // redirect response
  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const headers = new Headers(res.headers);
    const location = headers.get(ENUM.location);
    tinyassert(location);
    headers.delete(ENUM.location);
    headers.set(ENUM["x-loader-redirect-url"], location);
    headers.set(ENUM["x-loader-redirect-status"], String(res.status));
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  return res;
}

// cf. https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-react/routes.tsx#L210
export async function unwrapLoaderResult(res: Response): Promise<Response> {
  // exception
  if (res.headers.get(ENUM["x-loader-exception"])) {
    throw await unwrapLoaderException(res);
  }

  // error response
  if (res.headers.get(ENUM["x-loader-error-response"])) {
    throw res;
  }

  // redirect
  const redirectUrl = res.headers.get(ENUM["x-loader-redirect-url"]);
  if (redirectUrl) {
    const headers = new Headers(res.headers);
    const redirectStatus = headers.get(ENUM["x-loader-redirect-status"]);
    tinyassert(redirectStatus);
    headers.delete(ENUM["x-loader-redirect-url"]);
    headers.delete(ENUM["x-loader-redirect-status"]);
    headers.set(ENUM.location, redirectUrl);
    return new Response(null, {
      status: Number(redirectStatus),
      headers,
    });
  }

  return res;
}

function wrapLoaderException(e: unknown) {
  const error =
    e instanceof Error ? e : new Error("unknown loader request exception");
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
        [ENUM["x-loader-exception"]]: "1",
        "content-type": "application/json",
      },
    }
  );
}

async function unwrapLoaderException(res: Response) {
  return Object.assign(new Error(), await res.json());
}
