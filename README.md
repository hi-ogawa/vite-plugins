# vite-plugins

miscellaneous plugins to experiment with Vite's SSR build ideas.

## plugins

### `@hiogawa/vite-glob-routes`

- employ [`rakkasjs`](https://github.com/rakkasjs/rakkasjs)-like file-system route convension
- generate [`react-router`](https://github.com/remix-run/react-router) nested routes based on `**/*.page.tsx` and `**/layout.tsx`
- generate [`hattip`](https://github.com/hattipjs/hattip) middleware based on `**/*.api.ts`

### `@hiogawa/vite-import-index-html`

- it allows importing `index.html` for both development and production uniformly.
- [`ViteDevServer.transformIndexHtml`](https://vitejs.dev/guide/api-javascript.html#vitedevserver) is applied during development so HMR should work in a same way as normal `vite dev`.
- for example, it can be used as simple document template for SPA or SSR server.

## development

```sh
# develop demo
pnpm i
pnpm build
pnpm -C packages/demo dev

# release demo
pnpm -C packages/demo build
pnpm -C packages/demo release-production
```
