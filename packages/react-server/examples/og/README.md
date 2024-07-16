# @vercel/og example

https://next-vite-example-og.vercel.app

```sh
# local
pnpm dev
pnpm build
pnpm preview

# deploy vercel
vercel projects add next-vite-example-og
vercel link -p next-vite-example-og
pnpm vc-build
pnpm vc-release
```

## compare bundlers

```
node packages/react-server/examples/og/test-bundle.js nft
node packages/react-server/examples/og/test-bundle.js ncc
node packages/react-server/examples/og/test-bundle.js esbuild
```
