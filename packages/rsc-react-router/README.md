# @hiogawa/vite-rsc-react-router

An example to build RSC framework on Vite using [`@hiogawa/vite-rsc`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/rsc).

```js
import rsc from "@hiogawa/vite-rsc/plugin";
import { reactRouter } from "@hiogawa/vite-rsc-react-router/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    rsc(),
    reactRouter(),
  ],
});
```
