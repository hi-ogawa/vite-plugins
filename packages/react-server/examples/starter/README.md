# react-server starter example

[Try it on Stackblitz](https://stackblitz.com/edit/github-4hrb3q?file=src%2Fuse-client.tsx)

https://react-server-starter.hiro18181.workers.dev/

```sh
# download template e.g. by https://github.com/Rich-Harris/degit
#   degit hi-ogawa/vite-plugins/packages/react-server/examples/starter my-project
#   cd my-project
#   replace workspace:* with latest

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
