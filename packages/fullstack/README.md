# @hiogawa/vite-plugin-fullstack

## SSR Assets API proposal

This is a proposal to introduce a new API to allow non-client environment to access assets information commonly required for SSR.

Currently, it is prototyped in my package `@hiogawa/vite-plugin-fullstack` and it provides `import.meta.vite.assets` function with a following signature:

```ts
function assets({
  import?: string,
  environment?: string,
  asEntry?: boolean,
}): {
  entry?: string;               // script for <script type="module" src=...>
  js: { href: string, ... }[];  // dependency chunks for <link rel="modulepreload" href=... />
  css: { href: string, ... }[]; // dependency css for <link rel="stylesheet" href=... />
};
```

The goal of the API is to cover following use cases in SSR application:

- for server entry to access client entry

```js
// [server.js] server entry injecting client entry during SSR
function renderHtml() {
  const assets = import.meta.vite.assets({
    entry: "./client.js",
    environment: "client",
    asEntry: true,
  });
  const head = `
    <script type="module" src=${JSON.stringify(assets.entry)}></script>
    <link type="modulepreload" href=${JSON.stringify(assets.js[0].href)}></script>
    ...
  `;
  ...
}
```

- for universal route to access assets within its route
  - see [`examples/react-rotuer`](./examples/react-router) and [`examples/vue-router`](./examples/vue-router) for concrete integrations.

```js
// [routes.js] hypothetical router library's routes declaration
export const routes = [
  {
    path: "/about"
    route: () => import("./pages/about.js"),
    routeAssets: mergeAssets(
      import.meta.vite.assets({
        entry: "./pages/about.js",
        environment: "client",
      }),
      import.meta.vite.assets({
        entry: "./pages/about.js",
        environment: "ssr",
      }),
    )
  },
  ...
]
```

- server only app to access css

```js
// [server.js]
import "./styles.css" // this will be included in `assets.css` below

function renderHtml() {
  const assets = import.meta.vite.assets({
    // both `import` and `environment` is optional and they are default to current module and environment
    // import: "./server.js",
    // environment: "ssr",
  });
  const head = `
    <link type="stylesheet" href=${JSON.stringify(assets.css[0].href)}></script>
    ...
  `;
  ...
}
```

The API is enabled by adding a plugin and minimal build configuration, for example:

```js
// [vite.config.ts]
import { defineConfig } from "vite"
import fullstack from "@hiogawa/vite-plugin-fullstack"

export default defineConfig({
  plugins: [
    fullstack({
      // Ths plugin also provides server middleware using `export default { fetch }`
      // of `ssr.build.rollupOptions.input` entry.
      // This can be disabled by `serverHandler: false`
      // in favor of `@cloudflare/vite-plugin`, `nitro/vite`, etc.
      // > serverHandler: false,
    })
  ],
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        rollupOptions: {
          input: {
            index: "./src/entry.server.tsx",
          },
        },
      },
    }
  },
  builder: {
    async buildApp(builder) {
      // currently the plugin relies on this build order
      // to allow dynamically adding client entry
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    }
  }
})
```

See [./examples](./examples) for concrete usages.

| Example | Playground |
| --- | --- |
| [Basic](./examples/basic/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/basic) |
| [React Router](./examples/react-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/react-router) |
| [Vue Router](./examples/vue-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/vue-router) |
| [Nitro](https://github.com/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) | [stackblitz](https://stackblitz.com/github/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) |
| [Cloudflare](./examples/cloudflare/) | - |


## Feedback

Feedback is appreciated! I'm especially curious about opinions from framework authors, who have likely implemented own solutions without such abstract API. For example,

- Is the API powerful enough?
- Is there anything to watch out when implementing this type of API?
