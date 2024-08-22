# vite-plugin-server-asset

- `vitePluginWasmModule`
- `vitePluginFetchUrlImportMetaUrl`
- `./hooks/data.js`
- `./hooks/wasm.js`

## `vitePluginFetchUrlImportMetaUrl`

```ts
const fallbackFont = fetch(
  new URL("./noto-sans-v27-latin-regular.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

// ⇓⇓⇓ transform

// buildMode: "fs"
const fallbackFont = (async () => {
  const fs = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  return new Response(
    fs.readFileSync(
      fileURLToPath(
        new URL("noto-sans-v27-latin-regular-CirskmZh.ttf", import.meta.url).href,
      ),
    ),
  );
})().then((res) => res.arrayBuffer());

// buildMode: "import"
const fallbackFont = import("./noto-sans-v27-latin-regular.ttf-CirskmZh.bin")
  .then((mod) => new Response(mod.default))
  .then((res) => res.arrayBuffer());
```

## `vitePluginWasmModule`

TODO
