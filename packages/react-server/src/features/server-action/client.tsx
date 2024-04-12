import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { RedirectBoundary } from "../../client-internal";
import { __global } from "../../lib/global";
import { createError } from "../../server";
import { LayoutStateContext } from "../router/client";

export function useActionData<T extends (...args: any[]) => any>(
  action: T,
): Awaited<ReturnType<T>> | undefined {
  const actionId = (action as any).$$id;
  tinyassert(actionId);
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  if (data.action) {
    if (data.action.id === actionId) {
      return data.action.data as any;
    }
  }
  return;
}

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
