import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { renderToStream } from "@remix-run/dom/server";
import Root from "../root";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.server.tsx?assets=ssr";

const routes = {
  "/": () => import("../routes"),
  "/about": () => import("../routes/about"),
  "*": () => import("../routes/404"),
};

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // match route and render page
  const assets = mergeAssets(clientAssets, serverAssets);
  const match = routes[url.pathname as "/"] ?? routes["*"];
  const content = await (await match()).default();

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
  const root = (
    <Root head={head} pathname={url.pathname}>
      {content}
    </Root>
  );
  const html = renderToStream(root);
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
