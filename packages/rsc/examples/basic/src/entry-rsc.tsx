import { objectHas, tinyassert } from "@hiogawa/utils";
import reactServerDomServer from "react-server-dom-webpack/server.edge";
import { bundlerConfig } from "./lib/rsc";
import { Layout } from "./routes/layout";

// TODO: full <html> render?

export default function renderRsc() {
  const pathname = "/";
  const Page = pageModuleMap.get(pathname);
  console.log("-> reactServerDomServer.renderToReadableStream");
  const rscStream = reactServerDomServer.renderToReadableStream(
    <Layout>{Page ? <Page /> : <div>Not Found: {pathname}</div>}</Layout>,
    bundlerConfig
  );
  console.log("<- reactServerDomServer.renderToReadableStream");
  return { rscStream };
}

// cf. https://nextjs.org/docs/app/building-your-application/routing
// TODO: nesting?
// TODO: error page?
const pageModules = import.meta.glob("/src/routes/**/page.tsx", {
  eager: true,
});

const pageModuleMap = new Map(
  Object.entries(pageModules).map(([path, mod]) => {
    const m = path.match(/\/src\/routes(.*)\/page.tsx/);
    tinyassert(m && typeof m[1] === "string");
    tinyassert(objectHas(mod, "Page"));
    return [m[1] + "/", mod.Page as React.FC];
  })
);
