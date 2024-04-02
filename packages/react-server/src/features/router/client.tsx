import React from "react";
import { RedirectHandler } from "../../lib/client/error-boundary";
import { __global } from "../../lib/global";
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
  return <LayoutContent name={LAYOUT_ROOT_NAME} />;
}

export function ServerActionRedirectHandler() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);

  if (data.action?.error?.redirectLocation) {
    return (
      <RedirectHandler
        suspensionKey={data.action?.error}
        redirectLocation={data.action?.error.redirectLocation}
      />
    );
  }

  return null;
}
