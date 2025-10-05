import {
  type ImportAssetsResult,
  mergeAssets,
} from "@hiogawa/vite-plugin-fullstack/runtime";
import type { ComponentType } from "preact";
import { renderToReadableStream } from "preact-render-to-string/stream";
import clientAssets from "./entry.client.tsx?assets=client";

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let Page: ComponentType;
  let pageAssets: ImportAssetsResult[] = [];
  switch (url.pathname) {
    case "/": {
      Page = (await import("../routes")).default;
      pageAssets.push((await import("../routes?assets=ssr")).default);
      break;
    }
    case "/about": {
      Page = (await import("../routes/about")).default;
      pageAssets.push((await import("../routes/about?assets=ssr")).default);
      break;
    }
    default: {
      Page = (await import("../routes/not-found")).default;
    }
  }

  const assets = mergeAssets(clientAssets, ...pageAssets);

  function Root() {
    return (
      <html lang="en">
        <head>
          {assets.css.map((attrs) => (
            <link
              key={attrs.href}
              {...attrs}
              rel="stylesheet"
              crossOrigin="anonymous"
            />
          ))}
          {assets.js.map((attrs) => (
            <link
              key={attrs.href}
              {...attrs}
              rel="modulepreload"
              crossOrigin="anonymous"
            />
          ))}
          <script type="module" src={clientAssets.entry}></script>
        </head>
        <body>
          <Page />
        </body>
      </html>
    );
  }

  const html = renderToReadableStream(<Root />);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
