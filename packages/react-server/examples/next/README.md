# next test

- https://test-next-vite.vercel.app
- https://test-next-vite.pages.dev

```sh
# deploy vercel
vercel projects add test-next-vite
vercel link -p test-next-vite
pnpm vc-build
pnpm vc-release

# deploy cloudflare
wrangler pages project create test-next-vite --production-branch main --compatibility-date=2024-01-01 --compatibility-flags=nodejs_compat
pnpm cf-build
pnpm cf-preview
pnpm cf-release
```
