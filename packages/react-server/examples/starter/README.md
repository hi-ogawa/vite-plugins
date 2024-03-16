# react-server starter example

- https://react-server-starter.hiro18181.workers.dev/

```sh
# download template
npx tiged hi-ogawa/vite-plugins/packages/react-server/examples/starter my-app
cd my-app

# development
pnpm i
pnpm dev

# build and preview
pnpm build
pnpm preview

# deploy cloudflare workers
npm i -D wrangler
pnpm cf-build
pnpm cf-preview
pnpm cf-release
```
