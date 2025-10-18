# remix-hmr

Simple component HMR runtime and transform for [Remix 3](https://github.com/remix-run/remix), ported from [tiny-refresh](https://github.com/hi-ogawa/js-utils/tree/main/packages/tiny-refresh)

## Usage

```js
import { defineConfig } from "vite";
import remixHmr from "@hiogawa/remix-hmr/vite";

export default defineConfig({
  plugins: [remixHmr()],
});
```
