# vercel

script for vercel serverless deployment
(mostly copied from https://github.com/hi-ogawa/remix-vite-deployment-examples/tree/c419a75a4dbcebdc8b3b8ee8fe1e730e49767be1/misc/vercel-serverless)

```sh
# initial project setup
# (run from packages/rsc/examples/basic/misc/vercel-serverless)
vercel projects add rsc-experiment-hiroshi
vercel link -p rsc-experiment-hiroshi

# deploy
# (run from packages/rsc/examples/basic)
pnpm vc-build
pnpm vc-release
```
