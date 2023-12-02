# vite-plugin-ssr-middleware

Minimal version of [`@vavite/connet`](https://github.com/cyco130/vavite/tree/main/packages/connect)

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

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  res.end("hello!");
}
```
