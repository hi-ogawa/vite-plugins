# @hiogawa/vite-plugin-fullstack

## SSR Assets API Proposal

This proposal introduces a new API that enables SSR environments to access client assets information required for server-side rendering. This feature is currently prototyped in the package `@hiogawa/vite-plugin-fullstack`.

### `?assets` Query Import

The plugin provides a new query import `?assets` to access assets information of the module. There are three variations of the import:

```js
import assets from "./index.js?assets";
import assets from "./index.js?assets=client";
import assets from "./index.js?assets=ssr";
```

The default export of the `?assets` module has the following type:

```ts
type Assets = {
  entry?: string;               // Entry script for <script type="module" src=...>
  js: { href: string, ... }[];  // Preload chunks for <link rel="modulepreload" href=... />
  css: { href: string, ... }[]; // CSS files for <link rel="stylesheet" href=... />
}
```

The goal of this API is to cover the following use cases in SSR applications:

- **Server entry accessing client entry**: Enables the server to inject client-side assets during SSR

```js
// server.js - Server entry injecting client assets during SSR
import clientAssets from "./client.js?assets=client";

export function renderHtml(content) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        ${clientAssets.css.map(css => 
          `<link rel="stylesheet" href="${css.href}" />`
        ).join('\n')}
        ${clientAssets.js.map(js => 
          `<link rel="modulepreload" href="${js.href}" />`
        ).join('\n')}
        <script type="module" src="${clientAssets.entry}"></script>
      </head>
      <body>
        ...
  `;
}
```

- **Universal routes accessing their assets**: Routes shared by CSR and SSR can retrieve their associated assets
  - See [`examples/react-router`](./examples/react-router) and [`examples/vue-router`](./examples/vue-router) for detailed integrations

```js
// routes.js - Router configuration with assets preloading
export const routes = [
  {
    path: "/",
    route: () => import("./pages/index.js"),
    assets: () => import("./pages/index.js?assets"),
  },
  {
    path: "/about",
    route: () => import("./pages/about.js"),
    assets: () => import("./pages/about.js?assets"),
  },
  {
    path: "/products/:id",
    route: () => import("./pages/product.js"),
    assets: () => import("./pages/product.js?assets"),
  },
];
```

- **Server-only pages accessing CSS dependencies**: Server-rendered pages can retrieve their CSS assets

```js
// server.js - Server-side page with CSS dependencies
import "./styles.css"; // This CSS will be included in assets
import "./components/header.css";
import serverAssets from "./server.js?assets=ssr"; // Self-import with query

export function renderHtml() {
  // All imported CSS files are available in serverAssets.css
  const cssLinks = serverAssets.css
    .map(css => `<link rel="stylesheet" href="${css.href}" />`)
    .join('\n');
  // ...
}
```

## Configuration

The API is enabled by adding the plugin and minimal build configuration:

```js
// vite.config.ts
import { defineConfig } from "vite";
import fullstack from "@hiogawa/vite-plugin-fullstack";

export default defineConfig({
  plugins: [
    fullstack({
      // serverHandler: boolean (default: true)
      // This plugin also provides server middleware using `export default { fetch }`
      // from the `ssr.build.rollupOptions.input` entry.
      // This can be disabled by setting `serverHandler: false`
      // to use alternative server plugins like `@cloudflare/vite-plugin`, `nitro/vite`, etc.
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
      // Currently, the plugin requires this specific build order
      // to dynamically add client entries
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    }
  }
})
```

## Helper API

The plugin provides utility function `mergeAssets` to combines multiple assets objects into a single deduplicated assets object.

```js
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";

// Example: Merging assets from multiple route components
const route1Assets = await import("./pages/layout.js?assets");
const route2Assets = await import("./pages/home.js?assets");

const mergedAssets = mergeAssets(route1Assets, route2Assets);
// Result: { js: [...], css: [...] } with deduplicated entries
```


## TypeScript Support

TypeScript support for `?assets` imports can be enabled by adding the following to your `tsconfig.json`:

```json
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

Feedback is greatly appreciated! I'm particularly interested in hearing from framework authors who have likely implemented their own solutions without such an abstract API. Key questions include:

- Is the API sufficiently powerful for various use cases?
- Are there any implementation considerations or edge cases to be aware of?
- How can this API be improved to better serve framework needs?
