# @hiogawa/vite-rsc

## Features

- **Framework-less RSC experience**: The plugin implements [RSC conventions](https://react.dev/reference/rsc/server-components) and provides low level `react-server-dom` runtime API without framework-specific abstractions.
- **CSS support**: CSS is automatically code-split at client boundaries and injected upon rendering. For server components, CSS assets can be manually rendered via `import.meta.viteRscCss` API based on your own server routing conventions.
- **HMR support**: Enables editing both client and server components without full page reloads.
- **Runtime agnostic**: Built on [Vite environment API](https://vite.dev/guide/api-environment.html) and works with other runtimes (e.g., [`@cloudflare/vite-plugin`](https://github.com/cloudflare/workers-sdk/tree/main/packages/vite-plugin-cloudflare)).

## Examples

- [`./examples/starter`](./examples/starter)
- [`./examples/react-router`](./examples/react-router)
- [`./examples/basic`](./examples/basic)
- [`rsc-movies`](https://github.com/hi-ogawa/rsc-movies/)

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
import * as ReactServer from "@hiogawa/vite-rsc/rsc"; // React core API
import { importSsr } from "@hiogawa/vite-rsc/rsc"; // Vite specifc helper

// the plugin assumes `rsc` entry having default export of request handler
export default async function handler(request: Request): Promise<Response> {
  // serialize RSC
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
  const { handleSsr } = await importSsr<typeof import("./entry.ssr.tsx")>();
  const htmlStream = await handleSsr(rscStream);

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
import { getAssetsManifest } from "@hiogawa/vite-rsc/ssr";

export async function handleSsr(rscStream: ReadableStream) {
  // deserialize RSC
  // (NOTE: ssr deserization should be done inside a wrapper component, but it's simplified for doc.)
  const root = await ReactClient.createFromReadableStream(rscStream);

  // render html (traditional SSR)
  const htmlStream = ReactDOMServer.renderToReadableStream(root, {
    bootstrapScriptContent: getAssetsManifest().bootstrapScriptContent,
  })

  return htmlStream;
}
```

- [`entry.browser.tsx`](./examples/basic-doc/src/entry.browser.tsx)

```tsx
import * as ReactClient from "@hiogawa/vite-rsc/browser";
import * as ReactDOMClient from "react-dom/client";

async function main() {
  // fetch and deserialize RSC
  // (NOTE: extra fetch for hydration can be avoided but it's simplified for doc.)
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

#### `@hiogawa/vite-rsc/rsc`

- `importSsr<T>: () => Promise<T>`
  This allows importing `ssr` entry module inside `rsc` environment.

#### `@hiogawa/vite-rsc/ssr`

- `importRsc<T>: () => Promise<T>`
  This allows importing `rsc` entry module inside `ssr` environment.

- `getAssetsManifest().bootstrapScriptContent: string`
  This provides a code to execute browser entry on browser.

- `import.meta.viteRscCss: React.ReactNode`
  This allows collecting css which is imported through a current server module and injecting them inside server components.

```tsx
import "./test.css";
import child from "./child.tsx";

export function ServerPage() {
  // this will include css assets for "test.css"
  // and any css transitively imported through "child.tsx"
  return <>
    {import.meta.viteRscCss}
    ...
  </>
}
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
