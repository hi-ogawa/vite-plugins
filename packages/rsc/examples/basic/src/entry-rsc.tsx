import { objectMapKeys } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { generateRouteTree, matchRoute, renderMatchRoute } from "./lib/routing";
import { createBundlerConfig } from "./lib/rsc";

export function render({
  request,
  renderId,
}: {
  request: Request;
  renderId: string;
}) {
  const url = new URL(request.url);
  const result = router.run(url.pathname);
  const rscStream = reactServerDomServer.renderToReadableStream(
    result.node,
    createBundlerConfig({ renderId })
  );
  return { rscStream, status: result.match.notFound ? 404 : 200 };
}

const router = createRouter();

function createRouter() {
  const glob = import.meta.glob(
    "/src/routes/**/(page|layout).(js|jsx|ts|tsx)",
    {
      eager: true,
    }
  );
  const tree = generateRouteTree(
    objectMapKeys(glob, (_v, k) => k.slice("/src/routes".length))
  );

  function run(pathname: string) {
    const match = matchRoute(pathname, tree);
    const node = renderMatchRoute(match, <div>Not Found: {pathname}</div>);
    return { node, match };
  }

  return { run };
}
