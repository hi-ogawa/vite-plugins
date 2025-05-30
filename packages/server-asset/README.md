# vite-plugin-server-asset

## `vitePluginFetchUrlImportMetaUrl`

This plugin allows server side asset loading using `fetch(new URL("...", import.meta.url))`.
This pattern is available on [Next.js edge runtime](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#using-edge-runtime-with-local-assets)
and also it might become possible on [NodeJs](https://github.com/nodejs/undici/issues/2751#issuecomment-1944132179).

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

This plugin enables `.wasm?module` import as a uniform syntax to initialize `WebAssembly.Module`
since [Cloudflare](https://developers.cloudflare.com/pages/functions/module-support) requires `.wasm` to be initialized through `import`.

```ts
import resvg_wasm from "./resvg.wasm?module";

// ⇓⇓⇓ transform

// buildMode: "fs"
const resvg_wasm = new WebAssembly.Module(
  fs.readFileSync(
    fileURLToPath(new URL("resvg-Cjh1zH0p.wasm", import.meta.url).href),
  ),
);

// buildMode: "import"
import __wasm_B7t_kJnM from "./resvg-Cjh1zH0p.wasm"
```

## hooks

Custom hooks are provided to run `.bin` and `.wasm` on Node.

```ts
// to import "xxx.bin"
//   node --import '@hiogawa/vite-plugin-server-asset/hooks/register-data'
// or programatically
import { register } from "node:module"
register("@hiogawa/vite-plugin-server-asset/hooks/data", import.meta.url);

// to import "xxx.wasm"
//   node --import '@hiogawa/vite-plugin-server-asset/hooks/register-wasm'
// or programatically
import { register } from "node:module"
register("@hiogawa/vite-plugin-server-asset/hooks/wasm", import.meta.url);
```

### references

- https://developers.cloudflare.com/pages/functions/module-support
- https://vercel.com/docs/functions/wasm
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#using-edge-runtime-with-local-assets
- https://github.com/nodejs/undici/issues/2751#issuecomment-1944132179
