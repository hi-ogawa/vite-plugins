import {
  createStaticHandler,
  type StaticHandlerContext,
} from "react-router-dom/server";
import type { GlobPageRoutesResult } from "../../route-utils";
import { handleDateRequest } from "../data-request/server";
import type { RouterStaticHandler } from "./shared";

export type ServerRouterResult =
  | {
      type: "render";
      handler: RouterStaticHandler;
      context: StaticHandlerContext;
    }
  | {
      type: "response";
      response: Response;
    };

export async function handleReactRouterServer({
  routes,
  request,
  requestContext,
  onError,
}: {
  routes: GlobPageRoutesResult["routes"];
  request: Request;
  requestContext?: unknown; // provide app local context to server loader
  onError?: (e: unknown) => void; // for now only for data request loader exception since user code can process `context.errors` on its own.
}): Promise<ServerRouterResult> {
  const handler = createStaticHandler(routes);

  // handle direct server loader request (aka data request) https://github.com/remix-run/remix/blob/8268142371234795491070bafa23cd4607a36529/packages/remix-server-runtime/server.ts#L136-L139
  const dataRequestResponse = await handleDateRequest({
    handler,
    request,
    requestContext,
    onError,
  });
  if (dataRequestResponse) {
    return {
      type: "response",
      response: dataRequestResponse,
    };
  }

  // handle react-router SSR request
  const context = await handler.query(request, { requestContext });

  // handle non-render repsonse by loader (e.g. redirection)
  if (context instanceof Response) {
    return {
      type: "response",
      response: context,
    };
  }

  return {
    type: "render",
    handler,
    context,
  };
}
