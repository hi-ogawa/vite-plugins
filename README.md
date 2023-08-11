# vite-plugins

miscellaneous plugins to experiment with Vite's SSR build ideas.

## plugins

See `./packages/demo` for basic usage.

### `@hiogawa/vite-glob-routes`

- file-system route convention inspired by [`rakkasjs`](https://github.com/rakkasjs/rakkasjs) and [`vite-plugin-ssr`](https://github.com/brillout/vite-plugin-ssr)
- generate [`react-router`](https://github.com/remix-run/react-router) nested routes based on `**/*.page.tsx`, `**/*.page.server.tsx`, `**/layout.tsx`, and `**/layout.server.tsx`
- generate [`hattip`](https://github.com/hattipjs/hattip) middleware based on `**/*.api.ts`
- support `loader` for per-page data fetching in both SPA and SSR mode (similar to `loader` in [`remix`](https://github.com/remix-run/remix/) and `load` in [`@sveltejs/kit`](https://github.com/sveltejs/kit))

### `@hiogawa/vite-import-dev-server`

It exposes [`ViteDevServer`](https://vitejs.dev/guide/api-javascript.html#vitedevserver) for server code during development,
which is essential for:

- `ViteDevServer.transformIndexHtml` to inject HMR-related script
- `ViteDevServer.ssrFixStacktrace` to fix `Error.stack` from transpiled code

## development

```sh
# develop demo
pnpm i
pnpm build
pnpm dev

# release demo
pnpm -C packages/demo build
pnpm -C packages/demo release-production
```
