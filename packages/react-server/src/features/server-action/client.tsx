import { RedirectBoundary } from "../../runtime/client";
import { createError } from "../../server";
import { useFlightData } from "../router/client";

export function ActionRedirectHandler() {
  return (
    <RedirectBoundary>
      <ThrowActionError />
    </RedirectBoundary>
  );
}

// TODO: how to trigger nearest error page on action error?
function ThrowActionError() {
  const data = useFlightData();
  if (data.action?.error) {
    throw createError(data.action?.error);
  }
  return null;
}
