React port of [demo](../demo)

Since React provides only CJS, it doesn't seem to work out-of-the-box of Vite + Vite-Node on Workerd.
For now, I created `pre-bundle.mjs` CLI to pre-bundle CJS dependencies into ESM.
In `vite.config.ts`, this pre-bundled version is aliased for SSR via custom `resolveId`.

```sh
pnpm pre-bundle
pnpm dev-react
```
