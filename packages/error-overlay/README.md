# vite-plugin-error-overlay

Vite plugin to show client runtime error via builtin error overlay.

cf. https://github.com/vitejs/vite/pull/6274

## usage

```ts
import { defineConfig } from "vite";
import { vitePluginErrorOverlay } from "@hiogawa/vite-plugin-error-overlay";

export default defineConfig({
  plugins: [vitePluginErrorOverlay()],
});
```
