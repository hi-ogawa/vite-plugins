# Vite + RSC + Cloudflare Workers

The [Starter template](https://github.com/hi-ogawa/vite-plugins/tree/main/packages/rsc/examples/starter) integrated with [`@cloudflare/vite-plugin`](https://github.com/cloudflare/workers-sdk/tree/main/packages/vite-plugin-cloudflare).

- RSC environment always runs on Cloudflare Workers.
- During development, SSR environment runs as default node environment.
- During production, SSR environment build output is imported into RSC environment build.

```sh
# run dev server
npm run dev

# build for production and preview
npm run build
npm run preview
npm run release
```
