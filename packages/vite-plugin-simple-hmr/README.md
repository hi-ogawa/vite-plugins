# vite-plugin-simple-hmr

Simple HMR to reassign all exports, which can be useful for [SSR HMR](https://github.com/vitejs/vite/pull/12165) to accompany with React plugin's client HMR.

## example

See [./examples/react](./examples/react).

```tsx
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePluginSimpleHmr } from "@hiogawa/vite-plugin-simple-hmr";

export default defineConfig({
  plugins: [
    react(),
    vitePluginSimpleHmr({
      include: ["**/*.tsx"],
    }),
  ],
});
```
