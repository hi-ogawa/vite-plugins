import assert from "node:assert";
import path from "node:path";
import type { DefaultTreeAdapterMap } from "parse5";
import type { HtmlTagDescriptor, Plugin, ViteDevServer } from "vite";
import { normalizeRelativePath } from "./utils";

// the idea is:
// - run `transformIndexHtml` to empty html
// - parse output
// - extract <script> and <link> and turn them back to `transformIndexHtml` descriptors

// for build, we exploit `vite:build-html` plugin's behavior:
// - `transform` takes any `.html` module
// - `generateBundle` calls `emitFile` to output html

export function serverTransformIndexHtmlPlugin(): Plugin[] {
  let server: ViteDevServer;

  return [
    {
      name: "fullstack:server-transform-index-html",
      configureServer(server_) {
        server = server_;
      },
    },
    {
      name: "fullstack/server-transform-index-html/virtual",
      resolveId: {
        order: "pre",
        async handler(id) {
          if (id === "virtual:fullstack/server-transform-index-html") {
            if (this.environment.mode === "build") {
              // For build, trigger html generation and replace the placeholder later
              const resolved = await this.resolve(
                "__transform_placeholder.html",
              );
              await this.load({ id: resolved!.id });
              return {
                id: "\0virtual:fullstack/server-transform-index-html",
                external: true,
              };
            }
            return "\0" + id;
          }
        },
      },
      load: {
        order: "pre",
        async handler(id) {
          if (id === "\0virtual:fullstack/server-transform-index-html") {
            // For dev, directly call dev server `transformIndexHtml`
            assert(this.environment.mode === "dev");
            const html = await server.transformIndexHtml(
              "/",
              "<!DOCTYPE html><html><head></head><body></body></html>",
            );
            const result = await processHtml(html);
            return `export default ${JSON.stringify(result)}`;
          }
        },
      },
      renderChunk(code, chunk) {
        if (code.includes("\0virtual:fullstack/server-transform-index-html")) {
          const replacement = normalizeRelativePath(
            path.relative(
              path.join(chunk.fileName, ".."),
              "__transform_index_html_manifest.mjs",
            ),
          );
          code = code.replaceAll(
            "\0virtual:fullstack/server-transform-index-html",
            () => replacement,
          );
          return { code };
        }
      },
    },
    {
      name: "fullstack:server-transform-index-html/build-placeholder",
      resolveId: {
        order: "pre",
        handler(id) {
          // this virtual cannot use `\0virtual` convenion since
          // it breaks `emitFile` used by `vite:build-html` plugin
          if (id === "__transform_placeholder.html") {
            return id;
          }
        },
      },
      load: {
        order: "pre",
        async handler(id) {
          if (id === "__transform_placeholder.html") {
            return `<!DOCTYPE html><html><head></head><body></body></html>`;
          }
        },
      },
      transformIndexHtml() {
        return [
          {
            tag: "link",
            attrs: { rel: "stylesheet", href: "/style.css" },
          },
        ];
      },
      generateBundle: {
        order: "post",
        async handler(_options, bundle) {
          if (this.environment.name === "ssr") {
            const placeholder = bundle["__transform_placeholder.html"];
            delete bundle["__transform_placeholder.html"];
            assert(placeholder?.type === "asset");
            assert(typeof placeholder.source === "string");
            const result = await processHtml(placeholder.source);
            this.emitFile({
              type: "asset",
              fileName: "__transform_index_html_manifest.mjs",
              source: `export default ${JSON.stringify(result)}`,
            });
          }
        },
      },
    },
  ];
}

export async function processHtml(html: string): Promise<{
  head: string;
  body: string;
  descriptors: HtmlTagDescriptor[];
}> {
  const { parse } = await import("parse5");
  const ast = parse(html, {
    onParseError: (err) => console.error("[server-transform-index-html]", err),
  });
  const descriptors: HtmlTagDescriptor[] = [];
  let injectTo: HtmlTagDescriptor["injectTo"] = "head";
  traverseNodes(ast, (node) => {
    if (nodeIsElement(node)) {
      if (node.tagName === "body") {
        injectTo = "body";
      }
      if (node.tagName === "script" || node.tagName === "link") {
        const descriptor: HtmlTagDescriptor = {
          injectTo,
          tag: node.tagName,
          attrs: Object.fromEntries(
            node.attrs.map((attr) => [attr.name, attr.value]),
          ),
        };
        if (node.tagName === "script" && node.childNodes.length > 0) {
          const child = node.childNodes[0];
          if (nodeIsText(child!)) {
            descriptor.children = child.value;
          }
        }
        descriptors.push(descriptor);
      }
    }
  });
  const head = html.match(/<head>(.*)<\/head>/s)?.[1] ?? "";
  const body = html.match(/<body>(.*)<\/body>/s)?.[1] ?? "";
  return {
    head,
    body,
    descriptors,
  };
}

// copied from
// https://github.com/vitejs/vite/blob/84079a84ad94de4c1ef4f1bdb2ab448ff2c01196/packages/vite/src/node/plugins/html.ts#L176
function traverseNodes(
  node: DefaultTreeAdapterMap["node"],
  visitor: (node: DefaultTreeAdapterMap["node"]) => void,
) {
  if (node.nodeName === "template") {
    node = (node as DefaultTreeAdapterMap["template"]).content;
  }
  visitor(node);
  if (
    nodeIsElement(node) ||
    node.nodeName === "#document" ||
    node.nodeName === "#document-fragment"
  ) {
    node.childNodes.forEach((childNode) => traverseNodes(childNode, visitor));
  }
}

function nodeIsElement(
  node: DefaultTreeAdapterMap["node"],
): node is DefaultTreeAdapterMap["element"] {
  return node.nodeName[0] !== "#";
}

function nodeIsText(
  node: DefaultTreeAdapterMap["node"],
): node is DefaultTreeAdapterMap["textNode"] {
  return node.nodeName === "#text";
}
