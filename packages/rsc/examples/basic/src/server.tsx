import "./styles.css";
import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./routes/root";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const root = (
    <>
      {import.meta.viteRscCss}
      <Root url={url} />
    </>
  );
  const nonce = !process.env.NO_CSP ? crypto.randomUUID() : undefined;
  const response = await renderRequest(request, root, { nonce });
  if (nonce) {
    response.headers.set(
      "content-security-policy",
      `default-src 'self'; ` +
        // `unsafe-eval` is required during dev since React uses eval for findSourceMapURL feature
        `script-src 'self' 'nonce-${nonce}' ${import.meta.env.DEV ? `'unsafe-eval'` : ``} ; ` +
        `style-src 'self' 'nonce-${nonce}'; `,
    );
  }
  return response;
}
