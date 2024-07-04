import React from "react";
import { RedirectBoundary } from "../../runtime/client";
import { createError } from "../../server";
import { FlightDataContext } from "../router/client";

export function ActionRedirectHandler() {
  return (
    <RedirectBoundary>
      <ThrowActionError />
    </RedirectBoundary>
  );
}

// TODO: how to trigger nearest error page on action error?
function ThrowActionError() {
  const ctx = React.useContext(FlightDataContext);
  const data = React.use(ctx);
  if (data.action?.error) {
    throw createError(data.action?.error);
  }
  return null;
}
