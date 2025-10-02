import "./styles.css";
import { renderToReadableStream } from "react-dom/server.edge";
import {
  StaticRouterProvider,
  createStaticHandler,
  createStaticRouter,
} from "react-router";
import { routes } from "./routes";

const { query, dataRoutes } = createStaticHandler(routes);

const assets = import.meta.vite.assets({
  import: "./entry.client.tsx",
  environment: "client",
});
const serverAssets = import.meta.vite.assets();

async function handler(request: Request): Promise<Response> {
  const queryResult = await query(request);

  if (queryResult instanceof Response) {
    return queryResult;
  }

  const context = queryResult;
  const router = createStaticRouter(dataRoutes, context);

  function SsrRoot() {
    return (
      <>
        {[...assets.css, ...serverAssets.css].map((attrs) => (
          <link key={attrs.href} {...attrs} rel="stylesheet" crossOrigin="" />
        ))}
        {[...assets.js, ...serverAssets.js].map((attrs) => (
          <link
            key={attrs.href}
            {...attrs}
            rel="modulepreload"
            crossOrigin=""
          />
        ))}
        <StaticRouterProvider router={router} context={context} />
      </>
    );
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: `import(${JSON.stringify(assets.entry)})`,
  });

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
