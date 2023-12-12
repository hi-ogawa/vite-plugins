# vite-node-miniflare

Running [`vite-node`](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node) on [`miniflare`](https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare)

## examples

```ts
import { Miniflare } from "miniflare";
import { ViteNodeServer } from "vite-node";
import { generateViteMiniflareScript } from "@hiogawa/vite-miniflare";

const viteNodeServer = new ViteNodeServer({});

const viteMiniflareScript = generateViteMiniflareScript({
  entry: "./server.ts",
  // viteNodeServer,
});

const miniflare = new Miniflare({ script: viteMiniflareScript, ... });

miniflare.dispatchFetch("...");
```

```ts
import { vitePluginMiniflareSsr } from "@hiogawa/vite-miniflare/dist/plugin";

export default definConfig({
  plugins: [vitePluginMiniflareSsr({ script: "..." })],
});
```

## credits

- https://github.com/dario-piotrowicz/vite-workerd-ssr-request-handler-experimentation
- https://github.com/vitest-dev/vitest/tree/main/packages/vite-node
- https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare
