cloudflare runtime api example

```sh
pnpm dev
pnpm build
pnpm start

# deploy
wrangler pages project create test-next-vite-platform --production-branch main --compatibility-date=2024-01-01 --compatibility-flags=nodejs_compat_v2
wrangler kv namespace create kv
pnpm release
```
