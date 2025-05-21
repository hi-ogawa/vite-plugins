import "./styles.css";
import { renderRequest } from "@hiogawa/vite-rsc/extra/rsc";
import { Root } from "./routes/root";

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const root = (
    <>
      <Resources base={import.meta.env.BASE_URL.slice(0, -1)} />
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

// TODO: provide a wrapper component directly as utility?
async function Resources({
  base = "",
  nonce,
}: { base?: string; nonce?: string }) {
  const resources = await import("virtual:vite-rsc/resources" as any);
  return (
    <>
      {resources.default.css.map((href: string) => (
        <link
          rel="stylesheet"
          precedence="high"
          key={href}
          href={base + href}
          nonce={nonce}
        />
      ))}
      {resources.default.js.map((href: string) => (
        <script
          type="module"
          key={href}
          src={base + href}
          async
          nonce={nonce}
        />
      ))}
    </>
  );
}
