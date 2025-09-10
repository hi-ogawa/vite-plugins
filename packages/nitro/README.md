# @hiogawa/vite-plugin-nitro

Vite plugin for cross platform build using [`Nitro`](https://nitro.build/).

## Example with [`@vitejs/plugin-rsc`](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-rsc)

See also [vite-plugin-rsc-deploy-example](https://github.com/hi-ogawa/vite-plugin-rsc-deploy-example)

```js
// vite.config.ts
import { defineConfig } from "vite";
import nitro from "@vitejs/vite-plugin-rsc"
import rsc from "@hiogawa/vite-plugin-nitro"

export default defineConfig({
  plugins: [
    rsc(),
    nitro({
      server: {
        environmentName: "rsc",
      },
      config: {
        // Nitro automatically chooses a preset based on deployed environment,
        // but it can be explicitly specified if needed. e.g.
        // preset: 'vercel',
      },
    }),
  ],
});
```

## Related

- [official Nitro plugin](https://github.com/nitrojs/nitro/issues/3461)
