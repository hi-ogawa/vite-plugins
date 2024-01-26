import fs from "node:fs";
import { viteDevServer } from "@hiogawa/vite-import-dev-server/runtime";
import ReactDomServer from "react-dom/server";
import type { Connect } from "vite";
import { App } from "../App";

const handler: Connect.NextHandleFunction = async (_req, res) => {
  // template
  let html = await fs.promises.readFile("./index.html", "utf-8");
  html = await viteDevServer!.transformIndexHtml("/", html);

  // ssr
  const ssrHtml = ReactDomServer.renderToString(<App />);
  html = html.replace("<!--app-html-->", ssrHtml);

  res.setHeader("content-type", "text/html").end(html);
};

export default handler;
