# vite-node-miniflare

Running [`vite-node`](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node) on [`miniflare`](https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare)

## usage

```ts
//
// vite.config.ts
//
import { definConfig } from "vite";
import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";

export default definConfig({
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
