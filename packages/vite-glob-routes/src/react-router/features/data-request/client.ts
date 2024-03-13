import { tinyassert } from "@hiogawa/utils";
import { type DataRouteObject, type LoaderFunction } from "react-router";
import { walkArrayTree } from "../../route-utils";
import { mutateRouteObject } from "../core/client";
import { LOADER_HEADERS, LOADER_ROUTE_ID_PARAM } from "./shared";

export function injectDataRequestLoaders(
  routes: DataRouteObject[], // mutated
  selectedRouteIds: string[],
) {
  const ids = new Set(selectedRouteIds);
  walkArrayTree(routes, (route) => {
    if (ids.has(route.id)) {
      mutateRouteObject(route, (resolved) => {
        if (!resolved.loader) {
          resolved.loader = createDateRequestLoader(route.id);
        }
      });
    }
  });
}

export function createDateRequestLoader(routeId: string): LoaderFunction {
  return async (args) => {
    const req = wrapLoaderRequest(args.request, routeId);
    const res = await fetch(req);
    return unwrapLoaderResponse(res);
  };
}

function wrapLoaderRequest(req: Request, routeId: string): Request {
  const url = new URL(req.url);
  url.searchParams.set(LOADER_ROUTE_ID_PARAM, routeId);
  return new Request(url);
}

// cf. https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-react/routes.tsx#L210
async function unwrapLoaderResponse(res: Response): Promise<Response> {
  // non data request response (e.g. proxy returning error before reaching server, or simiply client/server code bug)
  if (!res.headers.get(LOADER_HEADERS["x-loader-response"])) {
    throw new Error("unexpected loader response", { cause: res });
  }

  // exception
  if (res.headers.get(LOADER_HEADERS["x-loader-exception"])) {
    throw await unwrapLoaderException(res);
  }

  // error response
  if (res.headers.get(LOADER_HEADERS["x-loader-error-response"])) {
    throw res;
  }

  // redirect
  const redirectUrl = res.headers.get(LOADER_HEADERS["x-loader-redirect-url"]);
  if (redirectUrl) {
    const headers = new Headers(res.headers);
    const redirectStatus = headers.get(
      LOADER_HEADERS["x-loader-redirect-status"],
    );
    tinyassert(redirectStatus);
    headers.delete(LOADER_HEADERS["x-loader-redirect-url"]);
    headers.delete(LOADER_HEADERS["x-loader-redirect-status"]);
    headers.set(LOADER_HEADERS.location, redirectUrl);
    return new Response(null, {
      status: Number(redirectStatus),
      headers,
    });
  }

  return res;
}

async function unwrapLoaderException(res: Response) {
  return Object.assign(new Error("unknown loader exception"), await res.json());
}
