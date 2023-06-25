import internal from "virtual:@hiogawa/vite-expose-index-html/internal";

export async function indexHtml(): Promise<string> {
  const { server, importIndexHtml } = internal;

  let { default: html } = await importIndexHtml();

  // inject hmr client
  if (server) {
    html = await server.transformIndexHtml("/", html);
  }

  return html;
}
