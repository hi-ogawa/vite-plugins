# vite-node-miniflare

Running [`vite-node`](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node) on [`miniflare`](https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare)

## usage

See also [`./demo-react`](./demo-react) for React SSR + Client Side HMR example.

```ts
//
// vite.config.ts
//
import { defineConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";

export default defineConfig({
  appType: "custom",
  ssr: {
    noExternal: true,
  },
  plugins: [vitePluginViteNodeMiniflare({ entry: "./worker-entry.ts" })],
});

//
// worker-entry.ts
//
export default {
  async fetch() {
    return new Response("hello workerd");
  },
};
```

## credits

- https://github.com/dario-piotrowicz/vite-workerd-ssr-request-handler-experimentation
- https://github.com/vitest-dev/vitest/tree/main/packages/vite-node
- https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare
- https://github.com/nuxt/nuxt/blob/1de44a5a5ca5757d53a8b52c9809cbc027d2d246/packages/vite/src/vite-node.ts
