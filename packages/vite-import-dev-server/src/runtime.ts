import internal from "virtual:@hiogawa/vite-import-dev-server/internal";

export async function importIndexHtml(): Promise<string> {
  const { server, importIndexHtmlRaw } = internal;

  let { default: html } = await importIndexHtmlRaw();

  // inject hmr client
  if (server) {
    html = await server.transformIndexHtml("/", html);
  }

  return html;
}
