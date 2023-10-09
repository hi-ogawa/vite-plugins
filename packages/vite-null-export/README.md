# vite-null-export

Vite port of remix's server-only file convention

- https://remix.run/docs/en/main/file-conventions/-server
- https://remix.run/docs/en/main/guides/gotchas#server-code-in-client-bundles
- https://github.com/remix-run/remix/blob/80c6842f547b7e83b58f1963894b07ad18c2dfe2/packages/remix-dev/compiler/plugins/emptyModules.ts#L10

## example

```tsx
// vite.config.ts

import { defineConfig } from "vite";
import { viteNullExportPlugin } from "@hiogawa/vite-null-export";

export default defineConfig({
  plugins: [
    viteNullExportPlugin({
      serverOnly: ["**/server/**", "**/*.server.*"],
    }),
  ],
});
```

## development

```sh
pnpm build
pnpm release
```
