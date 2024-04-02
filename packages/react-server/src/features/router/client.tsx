import React from "react";
import { useRouter } from "../../client";
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

// TODO: suspend like RedirectErrorHandler instead of effect
export function ServerActionRedirectHandler() {
  const ctx = React.useContext(LayoutStateContext);
  const data = React.use(ctx.data);

  const history = useRouter((s) => s.history);
  React.useEffect(() => {
    if (data.redirect) {
      history.push(data.redirect.location);
    }
  }, [data.redirect]);

  return null;
}
