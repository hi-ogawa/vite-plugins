import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";
import { useHead } from "@unhead/vue";
import { createHead, transformHtmlTemplate } from "@unhead/vue/server";
import { createSSRApp } from "vue";
import { RouterView, createMemoryHistory, createRouter } from "vue-router";
import { renderToString } from "vue/server-renderer";
import { routes } from "../routes";

const assets = import.meta.vite.assets({
  import: "./entry.client.tsx",
  environment: "client",
});

async function handler(request: Request): Promise<Response> {
  // setup app
  const app = createSSRApp(RouterView);

  // setup unhead
  // https://unhead.unjs.io/docs/vue/head/guides/get-started/installation
  const head = createHead();
  app.use(head);

  // setup vue-router
  // https://github.com/nuxt/nuxt/blob/766806c8d90015873f86c3f103b09803bd214258/packages/nuxt/src/pages/runtime/plugins/router.ts
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  app.use(router);

  // setup route change handler to inject head for route meta assets
  router.beforeEach((to, _from, next) => {
    const assets = mergeAssets(
      ...to.matched.flatMap((to) => to.meta.assets ?? []),
    );
    useHead({
      link: [
        ...assets.css.map((attrs) => ({ rel: "stylesheet", ...attrs })),
        ...assets.js.map((attrs) => ({ rel: "modulepreload", ...attrs })),
      ],
    });
    next();
  });

  const url = new URL(request.url);
  const href = url.href.slice(url.origin.length);
  await router.push(href);
  await router.isReady();

  // render
  const ssrStream = await renderToString(app);

  let htmlStream = `\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vue Router Custom Framework</title>
  <script type="module" src=${JSON.stringify(assets.entry)}></script>
</head>
<body>
  <div id="root">${ssrStream}</div>
</body>
</html>
`;
  htmlStream = await transformHtmlTemplate(head, htmlStream);

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
