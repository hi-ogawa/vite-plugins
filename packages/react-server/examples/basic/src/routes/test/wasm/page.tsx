import { once } from "@hiogawa/utils";
import { createHighlighterCore } from "shiki/core";
import js from "shiki/langs/javascript.mjs";
import nord from "shiki/themes/nord.mjs";

const getHighlither = once(async () => {
  // https://github.com/nodejs/undici/issues/2751#issuecomment-1944132179

  // const url = new URL("shiki/onig.wasm", import.meta.url);
  // url;
  // fetch(new URL("shiki/onig.wasm", import.meta.url));

  // fetch(new URL("shiki/onig.wasm", import.meta.url)).then((res) =>
  //   res.arrayBuffer(),
  // );
  // // const data
  // const wasmModule = new WebAssembly.Module(
  //   await fetch(new URL("shiki/onig.wasm", import.meta.url)).then((res) =>
  //     res.arrayBuffer(),
  //   ),
  // );
  // (await import("node:fs")).promises.readFile(new URL("shiki/onig.wasm", import.meta.url))
  // transformed to
  //   import("shiki/onig.wasm")
  // on cloudflare bundler
  // fetch

  return createHighlighterCore({
    themes: [nord],
    langs: [js],
    // non js extension file is not externalized
    // https://github.com/vitejs/vite/blob/fcf50c2e881356ea0d725cc563722712a2bf5695/packages/vite/src/node/plugins/resolve.ts#L810-L818
    loadWasm: import("shiki/onig.wasm" as string),
  });
});

export default async function Page() {
  const highligher = await getHighlither();
  const code = "const a = 1";
  const html = highligher.codeToHtml(code, {
    lang: "js",
    theme: "nord",
  });
  return (
    <div>
      <h4 className="font-bold">Wasm</h4>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
    </div>
  );
}
