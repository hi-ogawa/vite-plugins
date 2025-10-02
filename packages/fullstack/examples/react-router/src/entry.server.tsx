import { renderToReadableStream } from "react-dom/server.edge";
import "./styles.css";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
import { routes } from "./routes";

const { query, dataRoutes } = createStaticHandler(routes);

// // Impot client entry assets on server.
// // It doesn't support dynamically adding build entry,
// // so `build.rollupOption.input` still needs to be manually written.
// // This will include client js entry and its dependencies.
// // > { entry: string, js: { href: string, ... }[], css: { href: string, ... }[] }
// const assets = import.meta.vite.assets({
//   import: "./entry.client.tsx",
//   environment: "client",
// });

// // By default, `import` and `environment` are inferred as
// // current module and current environment, which in this case is,
// // > { import: "./entry.server.tsx", environment: "ssr" }
// // This will include only server css assets.
// // > { css: { href: string, ... }[] }
// const serverAssets = import.meta.vite.assets();

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

  const htmlStream = await renderToReadableStream(<SsrRoot />);

  // Setup headers from action and loaders from deepest match
  let leaf = context.matches[context.matches.length - 1]!;
  let actionHeaders = context.actionHeaders[leaf.route.id];
  let loaderHeaders = context.loaderHeaders[leaf.route.id];
  let headers = new Headers(actionHeaders);
  if (loaderHeaders) {
    for (let [key, value] of loaderHeaders.entries()) {
      headers.append(key, value);
    }
  }
  headers.set("Content-Type", "text/html;charset=utf-8");

  return new Response(htmlStream, {
    headers,
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
