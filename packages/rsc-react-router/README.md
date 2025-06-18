# @hiogawa/vite-rsc-react-router

This is a package to integrate [Experimental React Router RSC support](https://remix.run/blog/rsc-preview) on Vite using [`@hiogawa/vite-rsc`](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/rsc). It provides a basic [`routes.ts`](https://reactrouter.com/explanation/special-files#routests) support. See [rsc-movies](https://github.com/hi-ogawa/rsc-movies/) for an example.

## Usage

- `vite.config.ts`

```js
import rsc from "@hiogawa/vite-rsc/plugin";
import { reactRouter } from "@hiogawa/vite-rsc-react-router/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    reactRouter(),
    rsc(),
  ],
});
```
