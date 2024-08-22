# vite-plugin-server-asset

TODO: readme

- `vitePluginWasmModule`
- `vitePluginFetchUrlImportMetaUrl`
- `./hooks/data.js`
- `./hooks/wasm.js`

## `vitePluginWasmModule`

```ts
const fallbackFont = fetch(
  new URL("./noto-sans-v27-latin-regular.ttf", import.meta.url)
).then((res) => res.arrayBuffer())

// ⇓⇓⇓ transform

const fallbackFont = (async () => {
  const fs = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  return new Response(
    fs.readFileSync(
      fileURLToPath(
        new URL("noto-sans-v27-latin-regular-CirskmZh.ttf", import.meta.url).href
      )
    )
  );
})().then((res) => res.arrayBuffer());
```
