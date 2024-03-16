# vite-plugins

Random collection of vite plugins

## plugins

### [`@hiogawa/react-server`](./packages/react-server)

Vite plugin for React Server Component and Server Action

### [`@hiogawa/vite-node-miniflare`](./packages/vite-node-miniflare)

Plugin to run server side code on [`Worked (Miniflare)`](https://github.com/cloudflare/workers-sdk/tree/main/packages/miniflare)
during development via
~[`vite-node`](https://github.com/vitest-dev/vitest/tree/main/packages/vite-node)~
[`ViteRuntime`](https://github.com/vitejs/vite/discussions/15774).

### [`@hiogawa/vite-plugin-ssr-middleware`](./packages/vite-plugin-ssr-middleware)

Minimal version of [`@vavite/connet`](https://github.com/cyco130/vavite/tree/main/packages/connect)
and [`@vavite/expose-vite-dev-server`](https://github.com/cyco130/vavite/tree/main/packages/expose-vite-dev-server)

### [`@hiogawa/vite-glob-routes`](./packages/vite-glob-routes)

- file-system route convention inspired by [`rakkasjs`](https://github.com/rakkasjs/rakkasjs), [`vite-plugin-ssr`](https://github.com/brillout/vite-plugin-ssr), [`remix`](https://github.com/remix-run/remix), etc...
- generate [`react-router`](https://github.com/remix-run/react-router) nested routes based on `**/*.page.tsx`, `**/*.page.server.tsx`, `**/layout.tsx`, and `**/layout.server.tsx`
- generate [`hattip`](https://github.com/hattipjs/hattip) middleware based on `**/*.api.ts`
- support `loader` for per-page data fetching in both SPA and SSR mode (similar to `loader` in [`remix`](https://github.com/remix-run/remix/) and `load` in [`@sveltejs/kit`](https://github.com/sveltejs/kit))
