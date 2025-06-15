# @hiogawa/vite-rsc

## Features

- **Framework-less RSC experience**: The plugin implements [RSC conventions](https://react.dev/reference/rsc/server-components) and provides low level `react-server-dom` runtime API without framework-specific abstractions.
- **CSS support**: CSS is automatically code-split at client boundaries and injected upon rendering. For server components, CSS assets can be manually rendered via `import.meta.viteRsc.loadCss` API based on your own server routing conventions.
- **HMR support**: Enables editing both client and server components without full page reloads.
- **Runtime agnostic**: Built on [Vite environment API](https://vite.dev/guide/api-environment.html) and works with other runtimes (e.g., [`@cloudflare/vite-plugin`](https://github.com/cloudflare/workers-sdk/tree/main/packages/vite-plugin-cloudflare)).

## Examples

- [`./examples/starter`](./examples/starter)
  - This example provides an in-depth overview of API with inline comments to explain how they function within RSC-powered React application.
- [`./examples/react-router`](./examples/react-router)
  - This demonstrates how to integrate [experimental React Router RSC API](https://remix.run/blog/rsc-preview) with this plugin. It also includes `@cloudflare/vite-plugin` integration.
- [`./examples/basic`](./examples/basic)
  - This is mainly used for e2e testing and include various edge cases. It also uses a high level `@hiogawa/vite-rsc/extra/{rsc,ssr,browser}` API for quick setup.

## Basic Concepts

This example is a simplified version of [`./examples/starter`](./examples/starter). You can read [`./examples/starter/src/framework/entry.{rsc,ssr,browser}.tsx`](./examples/starter/src/framework) for more in-depth commentary, which includes server function handling and client-side RSC re-fetching/re-rendering.

This is the diagram to show the basic flow of RSC rendering process. See also https://github.com/hi-ogawa/vite-plugins/discussions/606.

```mermaid
graph TD

    subgraph "<strong>rsc environment</strong>"
        A["React virtual dom tree"] --> |"[@hiogawa/vite-rsc/rsc]<br /><code>renderToReadableStream</code>"| B1["RSC Stream"];
    end

    B1 --> B2
    B1 --> B3

    subgraph "<strong>ssr environment</strong>"
        B2["RSC Stream"] --> |"[@hiogawa/vite-rsc/ssr]<br /><code>createFromReadableStream</code>"| C1["React virtual dom tree"];
        C1 --> |"[react-dom/server]<br/>SSR"| E["HTML String/Stream"];
    end

    subgraph "<strong>client environment</strong>"
        B3["RSC Stream"] --> |"[@hiogawa/vite-rsc/browser]<br /><code>createFromReadableStream</code>"| C2["React virtual dom tree"];
        C2 --> |"[react-dom/client]<br/>CSR: mount, hydration"| D["DOM Elements"];
    end

    style A fill:#D6EAF8,stroke:#333,stroke-width:2px
    style B1 fill:#FEF9E7,stroke:#333,stroke-width:2px
    style B2 fill:#FEF9E7,stroke:#333,stroke-width:2px
    style B3 fill:#FEF9E7,stroke:#333,stroke-width:2px
    style C1 fill:#D6EAF8,stroke:#333,stroke-width:2px
    style C2 fill:#D6EAF8,stroke:#333,stroke-width:2px
    style D fill:#D5F5E3,stroke:#333,stroke-width:2px
    style E fill:#FADBD8,stroke:#333,stroke-width:2px
```

- [`vite.config.ts`](./examples/starter/vite.config.ts)

```js
import rsc from "@hiogawa/vite-rsc/plugin";

export default defineConfig() {
  plugins: [
    // add plugin
    rsc(),
  ],

  // specify entry point for each environment.
  // (currently the plugin assumes `rollupOptions.input.index` for some features.)
  environments: {
    // `rsc` environment loads modules with `react-server` condition.
    // this environment is responsible for:
    // - RSC stream serialization (React VDOM -> RSC stream)
    // - server functions handling
    rsc: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.rsc.tsx",
          },
        },
      },
    },

    // `ssr` environment loads modules without `react-server` condition.
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional SSR (React VDOM -> HTML string/stream)
    // (NOTE: as it can be seen in the above diagram. SSR is technically an optional mechanism.)
    ssr: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.ssr.tsx",
          },
        },
      },
    },

    // client environment is used for hydration and client-side rendering
    // this environment is responsible for:
    // - RSC stream deserialization (RSC stream -> React VDOM)
    // - traditional CSR (React VDOM -> Browser DOM tree mount/hydration)
    // - refetch and re-render RSC
    // - calling server functions
    client: {
      build: {
        rollupOptions: {
          input: {
            index: "./src/framework/entry.browser.tsx",
          },
        },
      },
    },
  },
}
```

- [`entry.rsc.tsx`](./examples/starter/src/framework/entry.rsc.tsx)

```tsx
import * as ReactServer from "@hiogawa/vite-rsc/rsc";

// the plugin assumes `rsc` entry having default export of request handler
export default async function handler(request: Request): Promise<Response> {
  // serialization React VDOM to RSC stream
  const root = <html><body><h1>Test</h1></body></html>;
  const rscStream = ReactServer.renderToReadableStream(root);

  // respond direct RSC stream request based on framework's convention
  if (request.url.endsWith(".rsc")) {
    return new Response(rscStream, {
      headers: {
        'Content-type': 'text/html'
      }
    })
  }

  // delegate to SSR environment for html rendering
  // `loadSsrModule` is a helper API provided by the plugin for multi environment interaction.
  const ssrEntry = await import.meta.viteRsc.loadSsrModule<typeof import("./entry.ssr.tsx")>();
  const htmlStream = await ssrEntry.handleSsr(rscStream);

  // respond html
  return new Response(htmlStream, {
    headers: {
      'Content-type': 'text/html'
    }
  })
}
```

- [`entry.ssr.tsx`](./examples/starter/src/framework/entry.ssr.tsx)

```tsx
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
import * as ReactDOMServer from "react-dom/server.edge";
// helper API to allow referencing browser entry content from SSR environment
import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";

export async function handleSsr(rscStream: ReadableStream) {
  // deserialize RSC stream back to React VDOM
  const root = await ReactClient.createFromReadableStream(rscStream);

  // render html (traditional SSR)
  const htmlStream = ReactDOMServer.renderToReadableStream(root, {
    bootstrapScriptContent,
  })

  return htmlStream;
}
```

- [`entry.browser.tsx`](./examples/starter/src/framework/entry.browser.tsx)

```tsx
import * as ReactClient from "@hiogawa/vite-rsc/browser";
import * as ReactDOMClient from "react-dom/client";

async function main() {
  // fetch and deserialize RSC stream back to React VDOM
  const rscResponse = await fetch(window.location.href + ".rsc");
  const root = await ReactClient.createFromReadableStream(rscResponse.body);

  // hydration (traditional CSR)
  ReactDOMClient.hydrateRoot(document, root);
}

main();
```

## `react-server-dom` API

These are mostly re-exports of `react-server-dom-xxx/server` and `react-server-dom-xxx/client`, aka React flight API.

#### `@hiogawa/vite-rsc/rsc`

- `renderToReadableStream`: RSC serialization (React VDOM -> RSC stream)
- `createFromReadableStream`: RSC deserialization (RSC stream -> React VDOM). This is also available on rsc environment itself. For example, it allows saving serailized RSC and deserializing it for later use.
- `decodeAction/decodeReply/loadServerAction`: server function related...

#### `@hiogawa/vite-rsc/ssr`

- `createFromReadableStream`: RSC deserialization (RSC stream -> React VDOM)

#### `@hiogawa/vite-rsc/browser`

- `createFromReadableStream`: RSC deserialization (RSC stream -> React VDOM)
- `createFromFetch`: a robust way of `createFromReadableStream((await fetch("...")).body)`
- `encodeReply/setServerCallback`: server function related...

## Environment helper API

The plugin provides an additional helper for multi environment interaction.

#### `rsc` environment

- `import.meta.viteRsc.loadSsrModule: <T>(entryName: string) => Promise<T>`
  This allows importing `ssr` environment module specified by `environments.ssr.build.rollupOptions.input[entryName]` inside `rsc` environment.

```js
import.meta.viteRsc.loadSsrModule("index");
```

- `import.meta.viteRsc.loadCss: () => React.ReactNode`
  This allows collecting css which is imported through a current server module
  and injecting them inside server components.

```tsx
import "./test.css";
import dep from "./dep.tsx";

export function ServerPage() {
  // this will include css assets for "test.css"
  // and any css transitively imported through "dep.tsx"
  return <>
    {import.meta.viteRsc.loadCss()}
    ...
  </>
}
```

#### `ssr` environment

- `virtual:vite-rsc/bootstrap-script-content`
  This provides a raw js code to execute a browser entry files specified by `environments.client.build.rollupOptions.index`. This is intended to be used with React DOM SSR API, such as [`renderToReadableStream`](https://react.dev/reference/react-dom/server/renderToReadableStream)

```js
import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content"
import { renderToReadableStream } from "react-dom/server.edge";

renderToReadableStream(reactNode, { bootstrapScriptContent });
```

## Higher level API

This is a wrapper of `react-server-dom` API and helper API to setup a minimal RSC app without writing own framework code like [`./examples/starter/src/framework`](./examples/starter/src/framework/). See [`./examples/basic`](./examples/basic/) for how this API is used.

#### `@hiogawa/vite-rsc/extra/rsc`

- `renderRequest`

#### `@hiogawa/vite-rsc/extra/ssr`

- `renderHtml`

#### `@hiogawa/vite-rsc/extra/browser`

- `hydrate`
