import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToReadableStream } from "react-dom/server.edge";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
import { type CustomHandle, routes } from "../routes";

const { query, dataRoutes } = createStaticHandler(routes);

const clientEntry = import.meta.vite.assets({
  import: "./entry.client.tsx",
  environment: "client",
  asEntry: true,
});

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
    ...context.matches
      .map((m) => m.route.handle as CustomHandle)
      .filter(Boolean)
      .map((h) => h.assets),
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
