import type { PageProps } from "@hiogawa/react-server/server";
import { once } from "@hiogawa/utils";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import js from "shiki/langs/javascript.mjs";
import nord from "shiki/themes/nord.mjs";

const getHighlither = once(async () => {
  return createHighlighterCore({
    themes: [nord],
    langs: [js],
    engine: createOnigurumaEngine(import("shiki/onig.wasm?module" as string)),
  });
});

export default async function Page(props: PageProps) {
  const highligher = await getHighlither();
  const code = props.searchParams["code"] || `export default "ok"`;
  const html = highligher.codeToHtml(code, {
    lang: "js",
    theme: "nord",
  });
  return (
    <div className="flex flex-col gap-2 p-2">
      <h4 className="font-lg">Wasm</h4>
      <a className="antd-link" href="https://github.com/shikijs/shiki">
        Shiki
      </a>
      <style>{`
        .shiki {
          padding: 0.5rem 1rem;
        }
      `}</style>
      <form method="GET" action="/test/wasm">
        <input className="antd-input px-2" name="code" defaultValue={code} />
      </form>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
    </div>
  );
}
