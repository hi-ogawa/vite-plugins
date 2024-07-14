import { tinyassert } from "@hiogawa/utils";
import { isRedirectError } from "../error/shared";
import type { RequestContext } from "../request-context/server";
import type { RevalidationType } from "../server-component/utils";
import type { ActionResult } from "./server";

const FLIGHT_REDIRECT_KEY = "x-flight-redirect";

type FlightRedirectMeta = {
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
  const error = actionResult.error;
  const redirect = error && isRedirectError(error);
  if (redirect) {
    const headers = new Headers(requestContext.getResponseHeaders());
    if (isStream) {
      headers.delete("location");
      headers.set(
        FLIGHT_REDIRECT_KEY,
        JSON.stringify({
          location: redirect.location,
          revalidate: requestContext.revalidate,
        } satisfies FlightRedirectMeta),
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

export function createFlightRedirectResponse(
  response: Response,
  requestContext: RequestContext,
) {
  const headers = new Headers(response.headers);
  const location = headers.get("location");
  tinyassert(typeof location === "string");
  headers.delete("location");
  headers.set(
    FLIGHT_REDIRECT_KEY,
    JSON.stringify({
      location,
      revalidate: requestContext.revalidate,
    } satisfies FlightRedirectMeta),
  );
  return new Response(null, {
    status: 200,
    headers,
  });
}

export function parseFlightRedirectResponse(response: Response) {
  const raw = response.headers.get(FLIGHT_REDIRECT_KEY);
  if (raw) {
    return JSON.parse(raw) as FlightRedirectMeta;
  }
  return;
}
