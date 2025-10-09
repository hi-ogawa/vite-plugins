# Proposal: Client assets metadata API for SSR

This proposal introduces a new API that enables server code to access client runtime assets metadata required for server-side rendering in a framework agnostic way. This feature is currently prototyped in the package [`@hiogawa/vite-plugin-fullstack`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack) with [examples](#examples).

## Motivation

The new API addresses two critical challenges that every SSR framework must solve:

1. **Asset preloading**: Preventing client-side assets waterfalls by knowing which assets to preload
2. **FOUC prevention**: Ensuring CSS is loaded with the HTML rendered on the server

Currently, meta-frameworks implement their own solutions for these problems. This proposal aims to provide a unified primitive that frameworks can adopt, reducing complexity and lowering the barrier for new custom frameworks to integrate SSR with Vite.

This proposal also aims to initiate discussion around common SSR asset handling patterns, with the hope of finding more robust and future-proof solutions through community feedback.

## Proposed API

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
  - This can also be used for implementing "Island Architecture" - see [`examples/island`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island)

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
  - See [`examples/react-router`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/react-router) and [`examples/vue-router`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/vue-router) for detailed integrations

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
  - See [`examples/island`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island)

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

### Runtime Helpers

The plugin provides a utility function `mergeAssets` to combine multiple assets objects into a single deduplicated assets object.

```js
import { mergeAssets } from "@hiogawa/vite-plugin-fullstack/runtime";

// Example: Merging assets from multiple route components
const route1Assets = await import("./pages/layout.js?assets");
const route2Assets = await import("./pages/home.js?assets");

const mergedAssets = mergeAssets(route1Assets, route2Assets);
// Result: { js: [...], css: [...] } with deduplicated entries
```

### Configuration

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
        emitAssets: true,
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

### TypeScript Support

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
| [Basic](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/basic/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/basic) |
| [React Router](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/react-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/react-router) |
| [Vue Router / SSG](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/vue-router/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/vue-router) |
| [Preact Island](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/island) |
| [Nitro](https://github.com/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) | [stackblitz](https://stackblitz.com/github/hi-ogawa/nitro-vite-examples/tree/10-02-feat_add_vue-router-ssr_example/examples/vue-router-ssr) |
| [Cloudflare](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/cloudflare/) | - |
| [Data Fetching](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/data-fetching/) | [stackblitz](https://stackblitz.com/github/hi-ogawa/vite-plugins/tree/main/packages/fullstack/examples/data-fetching) |


## How It Works

For a detailed explanation of the plugin's internal architecture and implementation, see [HOW_IT_WORKS.md](./HOW_IT_WORKS.md).

## Known limitations

- Duplicated CSS build for each environment (e.g. client build and ssr build)
  - Currently each CSS import is processed and built for each environment build, which can potentially cause inconsistency due to differing code splits, configuration, etc. This can cause duplicate CSS content loaded on client or break expected style processing.
- `?assets=client` doesn't provide `css` during dev.
  - Due to unbundled dev, the plugin doesn't eagerly traverse the client module graph and `?assets=client` provides only the `entry` field during dev. It's currently assumed that CSS files needed for SSR are the CSS files imported on the server module graph.

## Request for Feedback

Feedback is greatly appreciated! I'm particularly interested in hearing from framework authors who have likely implemented their own solutions. Key questions include:

- Is the API sufficiently powerful for various use cases?
- Are there any implementation considerations or edge cases to be aware of?
- How can this API be improved to better serve framework needs?
