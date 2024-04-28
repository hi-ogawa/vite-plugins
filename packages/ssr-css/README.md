# vite-plugin-ssr-css

This plugin provides `virtual:ssr-css.css` to collect styles reachable from `entries`.

When using `ViteDevServer.transformIndexHtml`, it will inject `<link rel="stylesheet" href="/@id/__x00__virtual:ssr-css.css" />` to `<head>`.

This works only during development.

## usage

```ts
import { defineConfig } from "vite";
import { vitePluginSsrCss } from "@hiogawa/vite-plugin-ssr-css";

export default defineConfig({
  plugins: [vitePluginSsrCss({ entries: ["/src/entry-client"] })],
});
```
