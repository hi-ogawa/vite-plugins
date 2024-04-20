import React from "react";
import { RedirectBoundary } from "../../runtime-client";
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

// re-export React.useActionState since the type is not officially available yet
export const useActionState: ReactUseActionState = (...args) =>
  (React as any).useActionState(...args);

// type is copied from ReactDOM.useFormState
// https://github.com/facebook/react/pull/28491
type ReactUseActionState = <State, Payload>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>,
  permalink?: string,
) => [
  state: Awaited<State>,
  dispatch: (payload: Payload) => void,
  isPending: boolean,
];
