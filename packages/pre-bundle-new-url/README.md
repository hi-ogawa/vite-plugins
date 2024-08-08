# vite-plugin-pre-bundle-new-url

Vite plugin to handle `new URL(..., import.meta.url)` and `new Worker(new URL(..., import.meta.url))`
for pre-bundled dependencies.

It uses esbuild's [`onLoad`](https://esbuild.github.io/plugins/#on-load) hook to transform in a following way:

```ts
// some-package/
//   index.js
//   image.svg
//   worker.js

// some-package/index.js
new URL("./image.svg", import.meta.url)
new Worker(new URL("./worker.js", import.meta.url))

// ⇓ transform (worker.js is recursively bundled using esbuild)

new URL("/absoute-path-to/node_modules/some-package/image.svg", import.meta.url)
new Worker(new URL("/absolute-path-to/node_modules/.vite/__worker/(hash).js", import.meta.url))
```

Note that this is only for _external packages_ during _development_
since Vite's normal transform pipeline works for non pre-bundled code.

## related

- https://github.com/vitejs/vite/pull/13501
- https://github.com/vitejs/vite/pull/16418
- https://github.com/chialab/rna/tree/main/packages/esbuild-plugin-meta-url
- https://github.com/users/hi-ogawa/projects/4/views/1?pane=issue&itemId=73410910
