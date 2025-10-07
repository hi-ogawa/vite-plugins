import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToReadableStream } from "preact-render-to-string/stream";
import Root from "../root";
import NotFound from "../routes/404";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.server.tsx?assets=ssr";

const routes = {
  "/": {
    render: () => import("../routes"),
    assets: () => import("../routes?assets=ssr"),
  },
  "/about": {
    render: () => import("../routes/about"),
    assets: () => import("../routes/about?assets=ssr"),
  },
};

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // match route
  let assets = mergeAssets(clientAssets, serverAssets);
  let content = <NotFound />;
  const match = routes[url.pathname as "/"];
  if (match) {
    // render page
    const renderModule = await match.render();
    content = await renderModule.default();
    // collect assets
    const assetsModule = (await match.assets()).default;
    assets = mergeAssets(assets, assetsModule);
  }

  // render assets as <head>
  const head = (
    <>
      {assets.css.map((attrs) => (
        <link key={attrs.href} {...attrs} rel="stylesheet" />
      ))}
      {assets.js.map((attrs) => (
        <link key={attrs.href} {...attrs} rel="modulepreload" />
      ))}
      <script type="module" src={clientAssets.entry}></script>
    </>
  );

  // SSR
  const root = <Root head={head}>{content}</Root>;
  const html = renderToReadableStream(root);
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
