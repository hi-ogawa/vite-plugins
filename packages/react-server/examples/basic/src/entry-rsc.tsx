import { objectMapKeys } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import type { ViteDevServer } from "vite";
import { generateRouteTree, matchRoute, renderMatchRoute } from "./lib/router";
import { createBundlerConfig } from "./lib/rsc";

export function render({ request }: { request: Request }) {
  const url = new URL(request.url);
  const result = router.run(url.pathname);
  const rscStream = reactServerDomServer.renderToReadableStream(
    result.node,
    createBundlerConfig(),
  );
  return { rscStream, status: result.match.notFound ? 404 : 200 };
}

const router = createRouter();

function createRouter() {
  const glob = import.meta.glob(
    "/src/routes/**/(page|layout).(js|jsx|ts|tsx)",
    {
      eager: true,
    },
  );
  const tree = generateRouteTree(
    objectMapKeys(glob, (_v, k) => k.slice("/src/routes".length)),
  );

  function run(pathname: string) {
    const match = matchRoute(pathname, tree);
    const node = renderMatchRoute(match, <div>Not Found: {pathname}</div>);
    return { node, match };
  }

  return { run };
}

//
// server action
//

declare let __rscDevServer: ViteDevServer;

export async function actionHandler({
  request,
  id,
}: {
  request: Request;
  id: string;
}) {
  let action: Function;
  const [file, name] = id.split("::") as [string, string];
  if (import.meta.env.DEV) {
    const mod: any = await __rscDevServer.ssrLoadModule(file);
    action = mod[name];
  } else {
    // include all "use server" files via virtual module on build
    const virtual = await import("virtual:rsc-use-server" as string);
    const mod = await virtual.default[file]();
    action = mod[name];
  }
  // TODO: decode properly?
  let formData = await request.formData();
  const decoded = (await reactServerDomServer.decodeReply(formData)) as any;
  await action(decoded[0]);
}
