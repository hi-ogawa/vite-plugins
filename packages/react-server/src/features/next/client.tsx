import React from "react";

export type SsrContextType = {
  callbacks: Set<ServerInsertedHTMLFn>;
};

type ServerInsertedHTMLFn = () => React.ReactNode;

export const SsrContext = React.createContext<SsrContextType | undefined>(
  undefined,
);

export function useServerInsertedHTML(callback: ServerInsertedHTMLFn) {
  const context = React.useContext(SsrContext);
  if (context) {
    // not sure if this is sound when ssr suspends
    // cf. https://github.com/vercel/next.js/pull/39559#discussion_r944679103
    context.callbacks.add(callback);
  }
}
