import { objectHas, tinyassert } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { createBundlerConfig } from "./lib/rsc";
import Layout from "./routes/layout";

// TODO: full <html> render?

export function render({
  request,
  renderId,
}: {
  request: Request;
  renderId: string;
}) {
  const url = new URL(request.url);
  const Page = pageModuleMap.get(url.pathname);
  const rscEl = (
    <Layout>{Page ? <Page /> : <div>Not Found: {url.pathname}</div>}</Layout>
  );
  const rscStream = reactServerDomServer.renderToReadableStream(
    rscEl,
    createBundlerConfig({ renderId })
  );
  return { rscStream, status: Page ? 200 : 404 };
}

// cf. https://nextjs.org/docs/app/building-your-application/routing
// TODO: nesting?
// TODO: error page?
// TODO: lazy? (eager: false)
const pageModules = import.meta.glob("/src/routes/**/page.tsx", {
  eager: true,
});

/**
 * {
 *   "/":      { Page: ... },
 *   "/other": { Page: ... },
 * }
 */
const pageModuleMap = new Map(
  Object.entries(pageModules).map(([path, mod]) => {
    const m = path.match(/\/src\/routes(.*)\/page.tsx/);
    tinyassert(m && typeof m[1] === "string");
    tinyassert(objectHas(mod, "default"));
    return [m[1] || "/", mod.default as React.FC];
  })
);
