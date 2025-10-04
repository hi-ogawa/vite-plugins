import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { createSSRApp } from "vue";
import { RouterView, createMemoryHistory, createRouter } from "vue-router";
import { renderToString } from "vue/server-renderer";
import { routes } from "../routes";
import clientEntry from "./entry.client.ts?assets=client";

async function handler(request: Request): Promise<Response> {
  // setup app
  const app = createSSRApp(RouterView);

  // setup vue-router
  // https://github.com/nuxt/nuxt/blob/766806c8d90015873f86c3f103b09803bd214258/packages/nuxt/src/pages/runtime/plugins/router.ts
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  app.use(router);

  const url = new URL(request.url);
  const href = url.href.slice(url.origin.length);
  await router.push(href);
  await router.isReady();

  // collect assets from current route
  const assets = mergeAssets(
    clientEntry,
    ...(await Promise.all(
      router.currentRoute.value.matched
        .map((to) => to.meta.assets)
        .filter(Boolean)
        .map((fn) => fn!().then((m) => m.default)),
    )),
  );
  const head = [
    ...assets.css.map((attrs) => {
      return `<link rel="stylesheet" ${Object.entries(attrs)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(" ")} />`;
    }),
    ...assets.js.map((attrs) => {
      return `<link rel="modulepreload" ${Object.entries(attrs)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(" ")} />`;
    }),
    `<script type="module" src=${JSON.stringify(clientEntry.entry)}></script>`,
  ];

  // render
  const ssrStream = await renderToString(app);

  const htmlStream = `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vue Router Custom Framework</title>
${head.map((s) => "  " + s).join("\n")}
</head>
<body>
  <div id="root">${ssrStream}</div>
</body>
</html>
`;

  return new Response(htmlStream, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
    },
  });
}

export default {
  fetch: handler,
};

if (import.meta.hot) {
  import.meta.hot.accept();
}
