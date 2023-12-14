React port of [demo](../demo)

Since React provides only CJS, it doesn't seem to work out-of-the-box on Vite + Vite-Node on Workerd with `ssr.optimizeDeps` etc...

To workaround this, I created `vitePluginPreBundle` to pre-bundle known CJS dependencies into ESM and then setup custom `resolveId` to swap out CJS version into ESM version.

```sh
pnpm dev-react
```
