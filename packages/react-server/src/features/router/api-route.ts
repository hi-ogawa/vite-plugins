import type { RequestContext } from "../request-context/server";
import type { RouteModuleTree } from "./server";
import { type MatchParams, matchRouteTree, toMatchParams } from "./tree";

// https://nextjs.org/docs/app/api-reference/file-conventions/route

export const API_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
] as const;

type ApiMethod = (typeof API_METHODS)[number];

type ApiHandler = (
  request: Request,
  context: { params: MatchParams },
) => Promise<Response> | Response;

export type ApiRouteMoudle = Record<ApiMethod, ApiHandler>;

export async function handleApiRoutes(
  tree: RouteModuleTree,
  request: Request,
  requestContext: RequestContext,
): Promise<Response | undefined> {
  const method = request.method as ApiMethod;
  const url = new URL(request.url);
  const matches = matchRouteTree(tree, url.pathname, "route");
  const match = matches?.at(-1);
  if (matches && match && match.segment.type === "route") {
    const handler = match?.node.value?.route?.[method];
    if (handler) {
      const params = toMatchParams(matches.map((m) => m.segment));
      const response = await requestContext.run(() =>
        handler(request, { params }),
      );
      return requestContext.injectResponseHeaders(response);
    }
  }
  return;
}
