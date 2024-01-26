# vite-plugin-hmr

Simple HMR to reassign all exports, which can be useful for [SSR HMR](https://github.com/vitejs/vite/pull/12165) to accompany with React plugin's client HMR.

## example

```tsx
//
// vite.config.ts
//
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePluginHmr } from "@hiogawa/vite-plugin-hmr";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-hmr";

export default defineConfig({
  plugins: [
    react(),
    vitePluginHmr({
      ssr: true,
    })
    vitePluginSsrMiddleware({
      entry: "./server.ts",
      useViteRuntime: true,
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
  // TODO
}

//
// app.tsx
//
export function App() {
  return <div>Hello</div>
}
```
