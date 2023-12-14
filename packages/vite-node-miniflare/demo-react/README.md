React port of [demo](../demo)

Since React provides only CJS, it doesn't seem to work out-of-the-box of Vite + Vite-Node on Workerd with `ssr.optimizeDeps` etc...

For now, I created `pre-bundle.mjs` CLI to pre-bundle CJS dependencies into ESM, then in `vite.config.ts`, the pre-bundled versions of packages are used for SSR via custom `resolveId` plugin.

```sh
pnpm pre-bundle
pnpm dev-react
```
