import React from "react";
import { __global } from "../../lib/global";
import { LAYOUT_ROOT_NAME, type ServerLayoutData } from "./utils";

type LayoutStateContextType = {
  data: Promise<ServerLayoutData>;
};

export const LayoutStateContext = React.createContext<LayoutStateContextType>(
  undefined!,
);

export function LayoutContent(props: { name: string }) {
  const layoutState = React.useContext(LayoutStateContext);
  const layout = React.use(layoutState.data);
  return layout[props.name];
}

export function LayoutRoot() {
  return <LayoutContent name={LAYOUT_ROOT_NAME} />;
}
