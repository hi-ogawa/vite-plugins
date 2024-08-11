import { once } from "@hiogawa/utils";
import { createHighlighterCore } from "shiki/core";
import js from "shiki/langs/javascript.mjs";
import nord from "shiki/themes/nord.mjs";

const getHighlither = once(async () => {
  return createHighlighterCore({
    themes: [nord],
    langs: [js],
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
