import { isRedirectError } from "../error/shared";
import type { ActionResult } from "./server";

export const ACTION_REDIRECT_LOCATION = "x-action-redirect-location";

export function createActionRedirectResponse({
  actionResult,
  isStream,
}: {
  actionResult: ActionResult;
  isStream: boolean;
}): Response | undefined {
  const error = actionResult.error;
  const redirect = error && isRedirectError(error);
  if (redirect) {
    const headers = new Headers({
      ...actionResult.responseHeaders,
      ...error.headers,
    });
    if (isStream) {
      headers.delete("location");
      headers.set(ACTION_REDIRECT_LOCATION, redirect.location);
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
