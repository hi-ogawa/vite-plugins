
## TODO

### MVP

- [ ] mvp API design + implementation
  - [x] client entry on server
  - [x] client assets / dependencies on server
  - [x] server css on server
- [ ] examples
  - [x] `create-vite-extra`-like ssr example https://github.com/bluwy/create-vite-extra/
  - [x] `@cloudflare/vite-plugin`
  - [ ] `nitro/vite` examples https://github.com/nitrojs/vite-examples
  - [x] island
    - [x] client only
    - [ ] ssr
    - [ ] fresh
  - [ ] router library
    - [x] react router
    - [x] vue router
      - scoped css hmr is broken :(
        because of `&lang.css` vs `&lang.css=` difference?
        it looks like new css link is returned as `text/javascript`?
        workarounded by forcing `&lang.css` via middleware.
- [ ] e2e
- [ ] docs
- [ ] RFC on vite discussion

### Future

- API
  - add client entry dynamically
  - `transformIndexHtml` on server
  - handle server change event (e.g. reload / refetch)
  - deduplicate client and server css on build when css code split differs
    - treat css on server like client reference?
- create custom integration of router libraries
  - react router
  - vue router
- test it on ecosystem framework
  - `fresh` (server css)


WIP

This plugin provides primitives to make building ssr application on Vite simpler.

## Features

- Framework agnostics
- ...

## Example

```js
import { defineConfig } from "vite";
import fullstack from "@hiogawa/vite-plugin-fullstack"

export default defineConfig({
  plugins: [
    fullstack(),
  ],
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/entry.client.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/entry.server.tsx",
          },
        },
      },
    }
  }
});
```

## Example with Nitro plugin

```js
import { defineConfig } from "vite";
import nitro from "nitro/vite"
import fullstack from "@hiogawa/vite-plugin-fullstack"

export default defineConfig({
  plugins: [
    nitro(),
    fullstack(),
  ],
});
```

## Ideas

- handle css on server
- access client asset on server runtime
  - js and css dependencies (e.g. modulepreload)
- `transformIndexHtml` compat/alternative
- cjs module runner
- "use client-entry"?
- dynamic entry injection?
- request handle convention (same as nitro)
- logger
- ssg primitive (may delegate to nitro?)
- multi platform deployment (delgate to nitro)

## Brainstorming

- design

```js
import.meta.vite.ssrAssets("/page.tsx");
import.meta.vite.ssrAssets(); // self-referencing
import.meta.vite.entryAssets("index"); // by entry name

import.meta.assetDeps("ssr", { entryName: "index" });
import.meta.assetDeps("entry:index", { environment: "ssr", entry });
import.meta.assetDeps("entry:index", { environment: "client" });
import.meta.assetsManifest();

type SsrAssetsInfo = {
  js: string[];
  css: string[];
}
type ClientEntry = {
  entry: string;
  js: string[];
  css: string[];
}
type ClientAssetsInfo = {
  entry: string;
  js: string[];
  css: string[];
}

// separate by environments?
type AssetsInfo = {
  css: string[];
  environments: {
    ssr?: {
      css: string[];
    },
    client?: {
      entry: string;
      js: string[];
      css: string[];
    },
  }
}

// use cases
// - entry.server.js references entry.client.js
import.meta.vite.assets({ import: "/entry.client.js", clientOnly: true })

// - universal route file references its assets
import.meta.vite.assets({ ssrOnly: true })

// - island references its assets
import.meta.vite.assets({ import: "", clientOnly: true })
```

## Questions

- doesn't this handle only initial render (ssr)? how about preloading assets on client side navigation?
  - This is not needed since Vite optimizes client dynamic import. https://vite.dev/guide/features.html#async-chunk-loading-optimization


## Initial assumptions

- environments: client, ssr

## Target 1

ssr/client universal route (e.g. React router, Vue router, etc.)

- routes.js
  - framework plugin can auto generate with server loader splitting etc.

```js
const routes = {
  "/": () => import("routes/index.js"),
  "/about": () => import("routes/about.js"),
}
```

- entry.server.js 

```js
import.meta.vite.entryAssets("/entry.client.js")
handleRequest(request, routes)
```

- entry.client.js

```js
hydrate(document, routes);
```

- routes/index.js

```js
export default function Page() {
  // ...
}

// manually or automatically inject by framework plugin
export const assets = import.meta.vite.ssrAssets();
```

## Target 2

ssr only route + client (ssr-optional) island (e.g. Astro, Fresh)

- routes.js

```js
const routes = {
  "/": () => import("routes/index.js"),
  "/about": () => import("routes/about.js"),
}
```

- entry.server.js

```js
handleRequest(request, routes)
```

- routes/index.js

```js
export default function Page() {
  // framework specific head injection
  const assets = import.meta.vite.ssrAssets();
}
```

- island.js
  - framework can apply transform to implement island

```js
export function Island() {
}
```

## Stages

- migrate minimal examples
  - https://github.com/bluwy/create-vite-extra/
  - https://github.com/nitrojs/vite-examples
- create custom integration of router libraries
  - react router
  - vue router
- integrate with ecosystem plugins
  - `@cloudflare/vite-plugin`
  - `nitro/vite`
  - `fresh`

## Examples

- `create-vite-extra` https://github.com/bluwy/create-vite-extra/
- `@cloudflare/vite-plugin`
- `nitro/vite`
- react router
- vue router
- `@remix-run/fetch-router` https://github.com/remix-run/remix/tree/main/packages/fetch-router

## References

- https://github.com/vitejs/vite/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22feat%3A%20ssr%22
  - https://github.com/vitejs/vite/issues/16515
