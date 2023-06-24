# vite-plugins

miscellaneous plugins to experiment with Vite's SSR build ideas.

## plugins

### `@hiogawa/vite-glob-routes`

- employ [`rakkasjs`](https://github.com/rakkasjs/rakkasjs)-like file-system route convension
- generate [`react-router`](https://github.com/remix-run/react-router) nested routes based on `**/*.page.tsx` and `**/layout.tsx`
- generate [`hattip`](https://github.com/hattipjs/hattip) middleware based on `**/*.api.ts`

### `@hiogawa/vite-index-html-middleware`

- generate `hattip` middleware to render `index.html` with the ability to inject code during runtime (e.g. server handing-off public configuration to client)

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
