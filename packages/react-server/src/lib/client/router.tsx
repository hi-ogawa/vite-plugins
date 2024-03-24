import type { RouterHistory } from "@tanstack/history";
import React from "react";

// TODO: merge with useRouter?
type ServerComponentTransitionContextType = {
  isPending: boolean;
  isActionPending: boolean;
};

export const ServerComponentTransitionContext =
  React.createContext<ServerComponentTransitionContextType>({
    isPending: false,
    isActionPending: false,
  });

type RouterContextType = {
  history: RouterHistory;
};

export const RouterContext = React.createContext<RouterContextType>({
  history: undefined!,
});

// TODO: can switch it internally with import.meta.env.SSR?
export function RouterProvider(
  props: React.PropsWithChildren<{ history: RouterHistory }>,
) {
  const rerender = React.useReducer((v) => !v, false)[1];

  React.useEffect(() => {
    return props.history.subscribe(() => {
      rerender();
    });
  }, [props.history]);

  return (
    <RouterContext.Provider value={{ history: props.history }}>
      {props.children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return React.useContext(RouterContext);
}
