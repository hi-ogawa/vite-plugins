# @hiogawa/vite-rsc

## Features

TODO

## Examples

- [`./examples/basic`](./examples/basic)
- [`./examples/react-router`](./examples/react-router)
- [`rsc-movies`](https://github.com/hi-ogawa/rsc-movies/)

## Basic Concepts

cf. https://github.com/hi-ogawa/vite-plugins/discussions/606

- `vite.config.ts`

```js
import rsc from "@hiogawa/vite-rsc/plugin";

export default defineConfig() {
  plugins: [
    rsc({
      entries: {
        // server module with react-server condition, which can do
        // - RSC serialization
        // - RSC deserialization
        // - server function handling
        rsc: "./entry.rsc.tsx",

        // server module without react-server condition, which can do
        // - RSC deserialization for SSR
        ssr: "./entry.ssr.tsx",

        // main script entry executed on browser, which can do
        // - RSC deserialization for hydration
        browser: "./entry.browser.tsx",
      },
    })
  ]
}
```

- `entry.rsc.tsx`

```tsx
import {
  // React API
  renderToReadableStream,
  decodeReply,
  loadServerAction,
  // Helper API
  initialize,
  importSsr,
} from "@hiogawa/vite-rsc/rsc";

// the plugin assumes `rsc` entry having default export of request handler
export default function handler(request: Request): Promise<Response> {
  // 1. RSC serialization
  const stream = renderToReadableStream(<Root />);

  // 2. delegate to SSR environment for html rendering
  const { handleSsr } = await importSsr<typeof import("./entry.ssr.tsx")>();
  return handleSsr(stream);
}

// root component
function Root() {
  return <html><body><h1>Test</h1></body></html>;
}
```

- `entry.ssr.tsx`

```tsx
import {} from "@hiogawa/vite-rsc/ssr";

export function handleSsr(stream: ReadableStream) {
  // 1. RSC deserialization for ssr
}
```

- `entry.browser.tsx`

```tsx
import {} from "@hiogawa/vite-rsc/browser";

function main() {
}

main();
```

## Handling server function

The first example omits

```tsx
TODO
```

## React API overview

- `renderToReadableStream`
- `createFromReadableStream`

## Helper API overview

- `importSsr`
- `import.meta.viteRscCss`
