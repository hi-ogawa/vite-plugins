# @hiogawa/vite-plugin-fullstack

## SSR Assets API proposal

This is a proposal to introduce a new API to allow ssr environment to access client assets information required for SSR. This feature is currently prototyped in the package `@hiogawa/vite-plugin-fullstack`.

### `?assets` query import

The plugin provides a new query import `?assets` to access assets information of the module. There are three variations of the import:

```js
import assets from "./index.js?assets";
import assets from "./index.js?assets=client";
import assets from "./index.js?assets=ssr";
```

The deafult import of `?assets` import has a following type:

```ts
const assets: {
  entry?: string;               // script for <script type="module" src=...>
  js: { href: string, ... }[];  // preload chunks for <link rel="modulepreload" href=... />
  css: { href: string, ... }[]; // css for <link rel="stylesheet" href=... />
}
```

The goal of the API is to cover following use cases in SSR application:

- Server entry can access client entry

```js
// [server.js] server entry injecting client entry script during SSR
import assets from "./client.js?assets=client"

function renderHtml() {
  const head = `
    <script type="module" src=${JSON.stringify(assets.entry)}></script>
    <link type="modulepreload" href=${JSON.stringify(assets.js[0].href)}></script>
    ...
  `;
}
```

- Universal route (shared by CSR and SSR) can access assets for its route
  - see [`examples/react-router`](./examples/react-router) and [`examples/vue-router`](./examples/vue-router) for detailed integrations.

```js
// [routes.js] hypothetical router library's routes declaration
export const routes = [
  {
    path: "/"
    route: () => import("./pages/index.js"),
    assets: () => import("./pages/index.js?assets"),
  },,
  {
    path: "/about"
    route: () => import("./pages/about.js"),
    assets: () => import("./pages/about.js?assets"),
  },
  ...
]
```

- Server only page can access its css dependencies

```js
// [server.js]
import "./styles.css" // this will be included in `assets`
import assets from "./server.js?assets=ssr" // self import with query

function renderHtml() {
  const head = `
    <link type="stylesheet" href=${JSON.stringify(assets.css[0].href)}></script>
    ...
  `;
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
      // [serverHandler: boolean]
      // Ths plugin also provides server middleware using `export default { fetch }`
      // of `ssr.build.rollupOptions.input` entry.
      // This can be disabled by `serverHandler: false`
      // and use `@cloudflare/vite-plugin`, `nitro/vite`, etc. instead.
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

### Helper API

...todo.... For example,

```js
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";

const matchedRoutes = /* ...(route library API)... */;
const assets = mergeAssets(...matchedRoutes.map(route => route.assets));

assets.js;
assets.css;
```

### Typescript

Type for `?assets` import can be enabled by adding following to `tsconfig.json`:

```js
{
  "compilerOptions": {
    "types": ["@hiogawa/vite-plugin-fullstack/types"]
  }
}
```

## Examples

| Example | Playground |
| --- | --- |
| [Basic](./examples/basic/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/basic) |
| [React Router](./examples/react-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/react-router) |
| [Vue Router / SSG](./examples/vue-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/vue-router) |
| [Nitro](https://github.com/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) | [stackblitz](https://stackblitz.com/github/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) |
| [Cloudflare](./examples/cloudflare/) | - |


## Feedback

Feedback is appreciated! I'm especially curious about opinions from framework authors, who have likely implemented own solutions without such abstract API. For example,

- Is the API powerful enough?
- Is there anything to watch out when implementing this type of API?
