import React from "react";

// TODO: rename
type ServerComponentTransitionContextType = {
  isPending: boolean;
  isActionPending: boolean;
};

export const ServerComponentTransitionContext =
  React.createContext<ServerComponentTransitionContextType>({
    isPending: false,
    isActionPending: false,
  });

export function BrowserRoot(props: {
  // initialStream
}) {
  props;
}

export function SsrRoot() {}
