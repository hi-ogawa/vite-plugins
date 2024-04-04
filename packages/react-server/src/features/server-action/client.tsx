import { tinyassert } from "@hiogawa/utils";
import React from "react";
import { RedirectBoundary } from "../../client-internal";
import { __global } from "../../lib/global";
import { createError } from "../../server";
import { LayoutStateContext } from "../router/client";
import { injectActionId } from "./utils";

// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L87
// https://github.com/facebook/react/blob/89021fb4ec9aa82194b0788566e736a4cedfc0e4/packages/react-client/src/ReactFlightReplyClient.js#L671-L678

export function createServerReference(id: string): React.FC {
  return Object.defineProperties(
    (...args: unknown[]) => {
      return __global.callServer(id, args);
    },
    {
      $$typeof: {
        value: Symbol.for("react.server.reference"),
      },
      $$id: {
        value: id,
        configurable: true,
      },
      $$bound: { value: null, configurable: true },
      $$FORM_ACTION: {
        value: (name: string) => {
          const data = new FormData();
          injectActionId(data, id);
          return {
            name,
            method: "POST",
            encType: "multipart/form-data",
            data,
          };
        },
      },
      bind: {
        value: () => {
          throw new Error("todo: createServerReference.bind");
        },
        configurable: true,
      },
    },
  ) as any;
}

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
