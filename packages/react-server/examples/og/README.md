# @vercel/og example

- https://next-vite-example-og.vercel.app
- https://next-vite-example-og.pages.dev/

```sh
# local
pnpm dev
pnpm build
pnpm preview

# deploy vercel serverless
vercel projects add next-vite-example-og
vercel link -p next-vite-example-og
pnpm vc-build
pnpm vc-release

# deploy cloudflare pages
pnpm cf-build
pnpm cf-preview
wrangler pages project create next-vite-example-og --production-branch main --compatibility-date=2024-01-01 --compatibility-flags=nodejs_compat
pnpm cf-release
```

## compare bundlers

```
node packages/react-server/examples/og/test-bundle.js nft
node packages/react-server/examples/og/test-bundle.js ncc
node packages/react-server/examples/og/test-bundle.js esbuild
```
