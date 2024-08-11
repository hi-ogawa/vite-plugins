import { codeToHtml } from "shiki";

export default async function Page() {
  const code = "const a = 1";
  const html = await codeToHtml(code, {
    lang: "javascript",
    theme: "vitesse-dark",
  });
  return (
    <div>
      <h4 className="font-bold">Wasm</h4>
      <div dangerouslySetInnerHTML={{ __html: html }}></div>
    </div>
  );
}
