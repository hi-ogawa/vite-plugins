# vite-plugin-ssr-middleware

Minimal version of [`@vavite/connet`](https://github.com/cyco130/vavite/tree/main/packages/connect)
and [`@vavite/expose-vite-dev-server`](https://github.com/cyco130/vavite/tree/main/packages/expose-vite-dev-server)

## example

```ts
//
// vite.config.ts
//
import { defineConfig } from "vite";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";

export default defineConfig({
  plugins: [
    vitePluginSsrMiddleware({
      entry: "./server.ts",
    }),
  ],
});

//
// server.ts
//
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";

export default function handler(
  req: IncomingMessage & { viteDevServer: ViteDevServer },
  res: ServerResponse,
  next: () => void
) {
  res.end("hello!");
}
```
