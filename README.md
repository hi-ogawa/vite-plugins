# vite-plugins

Random collection of vite plugins

## plugins

### [`@hiogawa/react-server`](./packages/react-server)

Next.js-like RSC framework on Vite

### [`@hiogawa/vite-plugin-ssr-middleware`](./packages/vite-plugin-ssr-middleware)

Minimal version of [`@vavite/connet`](https://github.com/cyco130/vavite/tree/main/packages/connect)
and [`@vavite/expose-vite-dev-server`](https://github.com/cyco130/vavite/tree/main/packages/expose-vite-dev-server)

## Development

### How to release a package

Example: `packages/transforms`

1. Manually bump `packages/transforms/package.json` version
2. Update changelog via `pnpm changelog packages/transforms`
3. Create a PR and merge to main
4. Locally run `pnpm release packages/transforms`
