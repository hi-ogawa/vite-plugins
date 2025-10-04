import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToReadableStream } from "react-dom/server.edge";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
import { routes } from "../routes";
import clientEntry from "./entry.client.tsx?assets=client";

const { query, dataRoutes } = createStaticHandler(routes);

async function handler(request: Request): Promise<Response> {
  const queryResult = await query(request);

  if (queryResult instanceof Response) {
    return queryResult;
  }

  const context = queryResult;
  const router = createStaticRouter(dataRoutes, context);

  // collect assets from matched routes
  const assets = mergeAssets(
    clientEntry,
    ...(await Promise.all(
      context.matches
        .map(
          (m) =>
            m.route.handle
              ?.assets?.()
              .then((v: typeof import("*?assets")) => v.default)!,
        )
        .filter(Boolean),
    )),
  );

  function SsrRoot() {
    return (
      <>
        {assets.js.map((attrs) => (
          <link
            {...attrs}
            rel="modulepreload"
            key={attrs.href}
            crossOrigin=""
          />
        ))}
        {assets.css.map((attrs) => (
          <link {...attrs} rel="stylesheet" key={attrs.href} crossOrigin="" />
        ))}
        <StaticRouterProvider router={router} context={context} />
      </>
    );
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: `import(${JSON.stringify(clientEntry.entry)})`,
  });

  return new Response(htmlStream, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
    },
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
