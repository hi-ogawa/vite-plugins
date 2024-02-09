import fs from "node:fs";
import type http from "node:http";
import { renderToString } from "react-dom/server";
import type { ViteDevServer } from "vite";
import { App } from "./App";

export default async function handler(
  req: http.IncomingMessage & { viteDevServer: ViteDevServer },
  res: http.ServerResponse
) {
  let html = await fs.promises.readFile("./index.html", "utf-8");
  html = await req.viteDevServer.transformIndexHtml("/", html);

  const ssrHtml = renderToString(<App />);
  html = html.replace("<!--@INJECT_SSR@-->", ssrHtml);

  res.setHeader("content-type", "text/html").end(html);
}
