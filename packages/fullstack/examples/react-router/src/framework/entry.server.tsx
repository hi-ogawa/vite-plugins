import { renderToReadableStream } from "react-dom/server.edge";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
import { routes } from "../routes";

const { query, dataRoutes } = createStaticHandler(routes);

const assets = import.meta.vite.assets({
  import: "./entry.client.tsx",
  environment: "client",
});

async function handler(request: Request): Promise<Response> {
  const queryResult = await query(request);

  if (queryResult instanceof Response) {
    return queryResult;
  }

  const context = queryResult;
  const router = createStaticRouter(dataRoutes, context);

  function SsrRoot() {
    return <StaticRouterProvider router={router} context={context} />;
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: `import(${JSON.stringify(assets.entry)})`,
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
