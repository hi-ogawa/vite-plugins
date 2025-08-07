# @hiogawa/vite-plugin-nitro

https://github.com/nitrojs/nitro/issues/3461

## Usage

- `vite.config.ts`

```js
import { defineConfig } from "vite";
import rsc from "@hiogawa/vite-plugin-nitro"
import nitro from "@vitejs/vite-plugin-rsc"

export default defineConfig({
  plugins: [
    rsc(),
    nitro({
      server: {
        environmentName: 'rsc',
        entryName: 'index',
      }
    }),
  ],
});
```
