import type { RouterHistory } from "@tanstack/history";
import React from "react";

// TODO: how to combine these in single context?
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

export function RouterProvider(
  props: React.PropsWithChildren<{ history: RouterHistory }>,
) {
  // TODO: tanstack-style refined state update on useRouter side
  // https://github.com/TanStack/router/blob/876b887589b14fb4bce0773eb520417682a741e2/packages/react-router/src/useRouterState.tsx
  // https://github.com/TanStack/store/blob/8d6faa0c8eb54b5b1070148311e43bb011a929f9/packages/react-store/src/index.ts
  // https://github.com/facebook/react/blob/f09e1599d631051a559974578a6d4c06effd95eb/packages/use-sync-external-store/src/useSyncExternalStoreWithSelector.js
  React.useSyncExternalStore(
    props.history.subscribe,
    () => props.history,
    () => props.history,
  );

  return (
    <RouterContext.Provider value={{ history: props.history }}>
      {props.children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return React.useContext(RouterContext);
}
