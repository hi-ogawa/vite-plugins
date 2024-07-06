import { injectResponseCookies } from "../next/cookie";
import type { RequestContext } from "../request-context/server";
import type { RouteModuleTree } from "./server";
import { type MatchParams, matchRouteTree, toMatchParamsObject } from "./tree";

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
  const { matches } = matchRouteTree(tree, url.pathname);
  const lastMatch = matches.at(-1);
  if (lastMatch) {
    const handler = lastMatch.node.value?.route?.[method];
    if (handler) {
      const params = toMatchParamsObject(lastMatch.params);
      const response = await requestContext.run(() =>
        handler(request, { params }),
      );
      return injectResponseCookies(
        response,
        requestContext.nextCookies.toResponseCookies(),
      );
    }
  }
  return;
}
