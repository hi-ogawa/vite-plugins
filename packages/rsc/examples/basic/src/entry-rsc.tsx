import { objectMapKeys } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { generateRouteTree, matchRoute } from "./lib/routing";
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
      // TODO: lazy? (eager: false)
      eager: true,
    }
  );
  const tree = generateRouteTree(
    objectMapKeys(glob, (_v, k) => k.slice("/src/routes".length))
  );

  function run(pathname: string) {
    const match = matchRoute(pathname, tree);
    const nodes = [...match.nodes].reverse();

    let acc: React.ReactNode = null;
    if (match.notFound) {
      acc = <div>Not Found: {pathname}</div>;
    } else {
      const Page = nodes[0]?.value?.page;
      acc = Page ? <Page /> : null; // TODO: handle as notFound?
    }

    for (const node of nodes) {
      const Layout = node.value?.layout;
      if (Layout) {
        acc = <Layout>{acc}</Layout>;
      }
    }

    return { node: acc, match };
  }

  return { run };
}
