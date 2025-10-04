import type { DefaultTreeAdapterMap } from "parse5";
import type { HtmlTagDescriptor, Plugin, ViteDevServer } from "vite";
import { createVirtualPlugin } from "./utils";

export function serverTransformIndexHtmlPlugin(): Plugin[] {
  let server: ViteDevServer;

  return [
    {
      name: "fullstack:server-transform-index-html",
      configEnvironment(name, _config, env) {
        if (name === "client" && env.command === "build") {
          // TODO: use virtual index.html during build
        }
      },
      configureServer(server_) {
        server = server_;
      },
    },
    createVirtualPlugin(
      "fullstack/server-transform-index-html",
      async function () {
        // - run `transformIndexHtml` to empty html
        // - parse output
        // - extract <script> and <link> and turn them back to descriptors
        const html = await server.transformIndexHtml(
          "/",
          "<!DOCTYPE html><html><head></head><body></body></html>",
        );
        const result = await processHtml(html);
        return `\
export const descriptors = ${JSON.stringify(result.descriptors)};
export const head = ${JSON.stringify(result.head)}
export const body = ${JSON.stringify(result.body)};
export const html = ${JSON.stringify(html)};
`;
      },
    ),
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
      if (node.tagName === 'body') {
        injectTo = 'body';
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
