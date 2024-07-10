import ReactDOMServer from "react-dom/server.edge";
import { SsrContext, type SsrContextType } from "./client";

// inject default meta viewport
export function injectDefaultMetaViewport() {
  const HEAD_END = "</head>";
  const META_VIEWPORT_PATTERN = `<meta name="viewport"`;
  const META_VIEWPORT_DEFAULT = `<meta name="viewport" content="width=device-width, initial-scale=1">`;

  let done = false;
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      if (done) {
        controller.enqueue(chunk);
        return;
      }
      if (chunk.includes(META_VIEWPORT_PATTERN)) {
        done = true;
      } else if (chunk.includes(HEAD_END)) {
        chunk = chunk.replace(
          HEAD_END,
          () => `${META_VIEWPORT_DEFAULT}${HEAD_END}`,
        );
        done = true;
      }
      controller.enqueue(chunk);
    },
  });
}

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
