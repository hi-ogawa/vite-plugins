# examples/spa

https://vite-plugins-example-spa-hiro18181.vercel.app

Even without SSR features, `@hiogawa/vite-glob-routes` can still provide:

- file-system routing convention
- code spliting per-page
- `loader` for client side fetching per-page

which is similar to a feature suggested in this discussion on Remix https://github.com/remix-run/remix/discussions/2853

## usage

```sh
# initial setup
bash misc/init.sh
pnpm update

# development
pnpm i
pnpm dev

# build for local preview
pnpm build
pnpm preview

# build for vercel static (see misc/vercel/README.md)
pnpm build-vercel
pnpm release-production
```

## sample projects

- https://github.com/hi-ogawa/youtube-dl-web-v2/tree/43d145ec013a0826235da5143e0fa7f7490ed07c/packages/app
