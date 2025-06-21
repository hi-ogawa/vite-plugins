# @hiogawa/vite-waku

WIP: https://github.com/hi-ogawa/waku/pull/2

## Usage

- `vite.config.ts`

```js
import rsc from "@hiogawa/vite-rsc/plugin";
import rscWaku from "@hiogawa/vite-rsc-waku/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    rscWaku(),
    rsc(),
  ],
});
```
