import { createHead, transformHtmlTemplate } from "@unhead/vue/server";
import { createSSRApp } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { renderToString } from "vue/server-renderer";
import Root from "../root.vue";
import { routes } from "../routes";

const assets = import.meta.vite.assets({
  import: "./entry.client.tsx",
  environment: "client",
});

async function handler(request: Request): Promise<Response> {
  // setup router
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  const url = new URL(request.url);
  const href = url.href.slice(url.origin.length);
  router.push(href);

  // setup app
  const app = createSSRApp(Root);
  app.use(router);

  // https://unhead.unjs.io/docs/vue/head/guides/get-started/installation
  const head = createHead();
  app.use(head);

  // render
  await router.isReady();
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
