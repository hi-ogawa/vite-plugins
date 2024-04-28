# vite-plugin-ssr-css

Provides `virtual:ssr-css.css` to collect styles reachable from `entries`.

## usage

```ts
import { defineConfig } from "vite";
import { vitePluginSsrCss } from "@hiogawa/vite-plugin-ssr-css";

export default defineConfig({
  plugins: [vitePluginSsrCss({ entries: ["/src/entry-client"] })],
});
```
