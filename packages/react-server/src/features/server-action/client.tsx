import React from "react";
import { RedirectBoundary } from "../../runtime/client";
import { createError } from "../../server";
import { LayoutStateContext } from "../router/client";

export function ActionRedirectHandler() {
  return (
    <RedirectBoundary>
      <ThrowActionError />
    </RedirectBoundary>
  );
}

// TODO: how to trigger nearest error page on action error?
function ThrowActionError() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  if (data.action?.error) {
    throw createError(data.action?.error);
  }
  return null;
}
