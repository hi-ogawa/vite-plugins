# vite-plugins

miscellaneous plugins to experiment with Vite's SSR build ideas.

## plugins

### `@hiogawa/vite-glob-routes`

- file-system route convention inspired by [`rakkasjs`](https://github.com/rakkasjs/rakkasjs) and [`vite-plugin-ssr`](https://github.com/brillout/vite-plugin-ssr)
- generate [`react-router`](https://github.com/remix-run/react-router) nested routes based on `**/*.page.tsx`, `**/*.page.server.tsx` and `**/layout.tsx`
- generate [`hattip`](https://github.com/hattipjs/hattip) middleware based on `**/*.api.ts`

### `@hiogawa/vite-expose-index-html`

- expose `index.html` for both development and production so that it can be used as a basic template of SSR

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
