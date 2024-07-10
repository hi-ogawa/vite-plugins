import React from "react";
import ReactDOMServer from "react-dom/server.edge";

type SsrContextType = {
  callbacks: Set<ServerInsertedHTMLFn>;
};

type ServerInsertedHTMLFn = () => React.ReactNode;

const SsrContext = React.createContext<SsrContextType | undefined>(undefined);

export function createSsrContext() {
  const context: SsrContextType = {
    callbacks: new Set(),
  };

  function Provider(props: React.PropsWithChildren) {
    return (
      <SsrContext.Provider value={context}>
        {props.children}
      </SsrContext.Provider>
    );
  }

  function render() {
    let html = "";
    for (const calback of context.callbacks) {
      html += ReactDOMServer.renderToStaticMarkup(calback());
    }
    return html;
  }

  return { Provider, render };
}

export function useServerInsertedHTML(callback: ServerInsertedHTMLFn) {
  const context = React.useContext(SsrContext);
  if (context) {
    // not sure if this is sound when ssr suspends
    // cf. https://github.com/vercel/next.js/pull/39559#discussion_r944679103
    context.callbacks.add(callback);
  }
}
