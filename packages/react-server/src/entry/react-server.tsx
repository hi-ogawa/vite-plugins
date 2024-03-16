import { objectMapKeys } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { generateRouteTree, matchRoute, renderMatchRoute } from "../lib/router";
import { createBundlerConfig } from "../lib/rsc";
import { ejectActionId } from "../lib/shared";

//
// render RSC
//

export function render({ request }: { request: Request }) {
  const result = router.run(request);
  const rscStream = reactServerDomServer.renderToReadableStream(
    result.node,
    createBundlerConfig(),
  );
  return { rscStream, status: result.match.notFound ? 404 : 200 };
}

//
// glob import routes
//

const router = createRouter();

function createRouter() {
  // for now hard code /src/routes as convention
  const glob = import.meta.glob(
    "/src/routes/**/(page|layout).(js|jsx|ts|tsx)",
    {
      eager: true,
    },
  );
  const tree = generateRouteTree(
    objectMapKeys(glob, (_v, k) => k.slice("/src/routes".length)),
  );

  function run(request: Request) {
    const url = new URL(request.url);
    const match = matchRoute(url.pathname, tree);
    const node = renderMatchRoute(
      { request, match },
      <div>Not Found: {url.pathname}</div>,
    );
    return { node, match };
  }

  return { run };
}

//
// server action
//

export async function actionHandler({ request }: { request: Request }) {
  const formData = await request.formData();
  if (0) {
    // TODO: proper decoding?
    await reactServerDomServer.decodeReply(formData);
  }
  const id = ejectActionId(formData);

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

  // TODO: action return value?
  await action(formData);
}
