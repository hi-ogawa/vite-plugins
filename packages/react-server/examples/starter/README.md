# react-server starter example

https://react-server-starter.hiro18181.workers.dev/

```sh
# download template by
#   npx degit@latest hi-ogawa/vite-plugins/packages/react-server/examples/starter my-project
#   cd my-project
#   replace "workspace:*" with "latest" in package.json

# development
npm i
npm run dev

# build and preview
npm run build
npm run preview

# deploy cloudflare workers
npm i -D wrangler
npm run cf-build
npm run cf-preview
npm run cf-release
```
