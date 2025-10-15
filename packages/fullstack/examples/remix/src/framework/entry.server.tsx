import assert from "node:assert";
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import type { Remix } from "@remix-run/dom";
import { jsx } from "@remix-run/dom/jsx-runtime";
import { renderToStream } from "@remix-run/dom/server";
import Root from "../root";
import clientAssets from "./entry.client.tsx?assets=client";
import serverAssets from "./entry.server.tsx?assets=ssr";

const routes = {
  "/": () => import("../routes"),
  "/about": () => import("../routes/about"),
  "/books": () => import("../routes/books"),
  "*": () => import("../routes/404"),
};

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api") {
    return handleApi(request);
  }

  if (url.pathname === "/__frame") {
    return renderToHtmlResponse(await resolveFrame(request.url));
  }

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
  return renderToHtmlResponse(root);
}

const frameModules = import.meta.glob("./*.tsx", { base: "/src/frames" });

const resolveFrame = async (src: string) => {
  const url = new URL(src, "http://localhost");
  assert(url.pathname === "/__frame");
  const entry = url.searchParams.get("entry")!;
  const exportName = url.searchParams.get("exportName")!;
  const props = JSON.parse(url.searchParams.get("props")!);
  const mod: any = await frameModules["./" + entry]();
  return jsx(mod[exportName].Component, props);
};

function renderToHtmlResponse(el: Remix.RemixNode) {
  const html = renderToStream(el, { resolveFrame });
  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}

async function handleApi(request: Request) {
  const url = new URL(request.url);
  assert(url.pathname === "/api");
  const api = await import("../routes/api");
  return api.POST(request);
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
