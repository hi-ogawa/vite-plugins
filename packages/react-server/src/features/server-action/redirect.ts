import { isRedirectError } from "../error/shared";
import type { RequestContext } from "../request-context/server";
import type { RevalidationType } from "../server-component/utils";
import type { ActionResult } from "./server";

// TODO: generalize to any flight request redirection e.g. by middleware

const ACTION_REDIRECT_KEY = "x-action-redirect";

type ActionRedirectMeta = {
  location: string;
  revalidate?: RevalidationType;
};

export function createActionRedirectResponse({
  actionResult,
  isStream,
  requestContext,
}: {
  actionResult: ActionResult;
  isStream: boolean;
  requestContext: RequestContext;
}): Response | undefined {
  requestContext.revalidate;
  const error = actionResult.error;
  const redirect = error && isRedirectError(error);
  if (redirect) {
    const headers = new Headers(requestContext.getResponseHeaders());
    if (isStream) {
      headers.delete("location");
      headers.set(
        ACTION_REDIRECT_KEY,
        JSON.stringify({
          location: redirect.location,
          revalidate: requestContext.revalidate,
        } satisfies ActionRedirectMeta),
      );
      return new Response(null, {
        status: 200,
        headers,
      });
    }
    return new Response(null, {
      status: error.status,
      headers,
    });
  }
  return;
}

export function parseActionRedirectResponse(response: Response) {
  const raw = response.headers.get(ACTION_REDIRECT_KEY);
  if (raw) {
    return JSON.parse(raw) as ActionRedirectMeta;
  }
  return;
}
