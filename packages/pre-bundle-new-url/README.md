# vite-plugin-pre-bundle-new-url

Vite plugin to handle `new URL(..., import.meta.url)` and `new Worker(new URL(..., import.meta.url))`
for pre-bundled dependencies.

- https://github.com/vitejs/vite/pull/13501
- https://github.com/vitejs/vite/pull/16418
- https://github.com/chialab/rna/tree/main/packages/esbuild-plugin-meta-url
- https://github.com/users/hi-ogawa/projects/4/views/1?pane=issue&itemId=73410910
