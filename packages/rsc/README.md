# @hiogawa/vite-rsc

## Features

- **Framework-less RSC experience**: The plugin implements [RSC conventions](https://react.dev/reference/rsc/server-components) and provides low level `react-server-dom` runtime API without framework-specific abstractions.
- **CSS support**: CSS is automatically code-split at client boundaries and injected upon rendering. For server components, CSS assets can be manually rendered via `import.meta.viteRsc.loadCss` API based on your own server routing conventions.
- **HMR support**: Enables editing both client and server components without full page reloads.
- **Runtime agnostic**: Built on [Vite environment API](https://vite.dev/guide/api-environment.html) and works with other runtimes (e.g., [`@cloudflare/vite-plugin`](https://github.com/cloudflare/workers-sdk/tree/main/packages/vite-plugin-cloudflare)).

## Examples

- [`./examples/starter`](./examples/starter)
  - TODO: explain
- [`./examples/react-router`](./examples/react-router)
  - TODO: explain https://remix.run/blog/rsc-preview
- [`./examples/basic`](./examples/basic)
  - TODO: explain main example for integration tests
- [`rsc-movies`](https://github.com/hi-ogawa/rsc-movies/)
  - TODO: explain

## Basic Concepts

This example can be found in [`./examples/basic-doc`](./examples/basic-doc).

- [`vite.config.ts`](./examples/basic-doc/vite.config.ts)

```js
import rsc from "@hiogawa/vite-rsc/plugin";

export default defineConfig() {
  plugins: [
    rsc({
      entries: {
        // server entry with react-server condition, which should manage:
        // - RSC serialization
        // - server functions handling
        rsc: "./src/entry.rsc.tsx",

        // server entry without react-server condition, which should manage:
        // - RSC deserialization for SSR
        ssr: "./src/entry.ssr.tsx",

        // main script entry executed on browser, which should manage:
        // - RSC deserialization for hydration
        // - refetch and re-render RSC
        // - calling server functions
        client: "./src/entry.browser.tsx",
      },
    })
  ]
}
```

- [`entry.rsc.tsx`](./examples/basic-doc/src/entry.rsc.tsx)

```tsx
import * as ReactServer from "@hiogawa/vite-rsc/rsc";

// the plugin assumes `rsc` entry having default export of request handler
export default async function handler(request: Request): Promise<Response> {
  // serialize React tree to RSC stream
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

- [`entry.ssr.tsx`](./examples/basic-doc/src/entry.ssr.tsx)

```tsx
import * as ReactClient from "@hiogawa/vite-rsc/ssr";
import * as ReactDOMServer from "react-dom/server.edge";
import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";

export async function handleSsr(rscStream: ReadableStream) {
  // deserialize RSC stream back to React tree
  const root = await ReactClient.createFromReadableStream(rscStream);

  // render html (traditional SSR)
  const htmlStream = ReactDOMServer.renderToReadableStream(root, {
    bootstrapScriptContent,
  })

  return htmlStream;
}
```

- [`entry.browser.tsx`](./examples/basic-doc/src/entry.browser.tsx)

```tsx
import * as ReactClient from "@hiogawa/vite-rsc/browser";
import * as ReactDOMClient from "react-dom/client";

async function main() {
  // fetch and deserialize RSC back to React tree
  const rscResponse = await fetch(window.location.href + ".rsc");
  const root = await ReactClient.createFromReadableStream(rscResponse.body);

  // hydration (traditional CSR)
  ReactDOMClient.hydrateRoot(document, root);
}

main();
```

## Handling server function

TODO

For now, please read [`./examples/starter/src/framework/entry.{browser,rsc}.tsx`](./examples/starter/src/framework) to get the idea.

## RSC API

These are mostly re-exports of `react-server-dom-xxx/server` and `react-server-dom-xxx/client`, aka React flight API.

#### `@hiogawa/vite-rsc/rsc`

- `renderToReadableStream`: RSC serialization
- `createFromReadableStream`: RSC deserialization (This is also available on rsc environment itself. For example, it allows saving serailized RSC and deserializing it for later use.)
- `decodeAction/decodeReply/loadServerAction`: server function related

#### `@hiogawa/vite-rsc/ssr`

- `createFromReadableStream`: RSC deserialization on server for SSR

#### `@hiogawa/vite-rsc/browser`

- `createFromReadableStream`: RSC deserialization on browser for hydration
- `createFromFetch`: a robust way of `createFromReadableStream((await fetch("...")).body)`
- `encodeReply/setServerCallback`: server function related

## Helper API

These API provide a necessary API to integrate multi environment features into an app.

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

## Higher level RSC API

This is a simple wrapper of the first "RSC API". See [`./examples/basic`](./examples/basic/) for usage.
Also you can read implementations [`./src/extra/{rsc,ssr,browser}`](./src/extra/) to understand
how bare RSC API is intended to be used.

#### `@hiogawa/vite-rsc/extra/rsc`

- `renderRequest`

#### `@hiogawa/vite-rsc/extra/ssr`

- `renderHtml`

#### `@hiogawa/vite-rsc/extra/browser`

- `hydrate`
