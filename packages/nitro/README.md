# @hiogawa/vite-plugin-nitro

Vite plugin for cross platform build using [`Nitro`](https://nitro.build/). This is an temporary solution until we figure out integration of [official Nitro plugin](https://github.com/nitrojs/nitro/issues/3461) with [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc).

## Example

```js
// vite.config.ts
import { defineConfig } from "vite";
import rsc from "@hiogawa/vite-plugin-nitro"
import nitro from "@vitejs/vite-plugin-rsc"

export default defineConfig({
  plugins: [
    rsc(),
    nitro({
      server: {
        environmentName: "rsc",
      },
      config: {
        preset: "vercel",
      },
    }),
  ],
});
```
