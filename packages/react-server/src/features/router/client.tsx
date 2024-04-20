import React from "react";
import { RedirectHandler } from "../../lib/client/error-boundary";
import { isRedirectError } from "../../lib/error";
import { ActionRedirectHandler } from "../server-action/client";
import { LAYOUT_ROOT_NAME, type ServerRouterData } from "./utils";

type LayoutStateContextType = {
  data: Promise<ServerRouterData>;
};

export const LayoutStateContext = React.createContext<LayoutStateContextType>(
  undefined!,
);

export function LayoutContent(props: { name: string }) {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);
  return data.layout[props.name];
}

export function LayoutRoot() {
  return (
    <>
      <LayoutContent name={LAYOUT_ROOT_NAME} />
      <ActionRedirectHandler />
    </>
  );
}

// TODO: remove
// TODO: handle non redirect action error
export function ServerActionRedirectHandler() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);

  if (data.action?.error) {
    const redirect = isRedirectError(data.action.error);
    if (redirect) {
      return (
        <RedirectHandler
          suspensionKey={data.action.error}
          redirectLocation={redirect.location}
        />
      );
    }
  }
  return null;
}

export const ROUTER_REVALIDATE_KEY = "__REVALIDATE";

export function routerRevalidate() {
  return { [ROUTER_REVALIDATE_KEY]: true };
}
