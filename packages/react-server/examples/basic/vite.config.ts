import path from "node:path";
import { vitePluginReactServer } from "@hiogawa/react-server/plugin";
import { vitePluginSsrMiddleware } from "@hiogawa/vite-plugin-ssr-middleware";
import react from "@vitejs/plugin-react";
import { Connect, type Plugin, defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  plugins: [
    react(),
    vitePluginReactServer({
      plugins: [testVitePluginVirtual()],
    }),
    httpLoggerPlugin(),
    vitePluginSsrMiddleware({
      entry: process.env["SSR_ENTRY"] || "/src/adapters/node.ts",
      preview: path.resolve("./dist/server/index.js"),
    }),
    testVitePluginVirtual(),
  ],
});

function testVitePluginVirtual(): Plugin {
  return {
    name: "test:" + testVitePluginVirtual.name,
    resolveId(source, _importer, _options) {
      if (source === "virtual:use-client") {
        return "\0" + source;
      }
      return;
    },
    load(id, _options) {
      if (id === "\0virtual:use-client") {
        return /* js */ `
          "use client";
          export function VirtualUseClient() {
            return "VirtualUseClient";
          }
        `.trimStart();
      }
      return;
    },
  };
}

// TODO: move to vitePluginSsrMiddleware?
function httpLoggerPlugin(): Plugin {
  return {
    name: "http-logger",
    configureServer(server) {
      return () => server.middlewares.use(httpLogger());
    },
    configurePreviewServer(server) {
      return () => server.middlewares.use(httpLogger());
    },
  };
}

function httpLogger(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = new URL(req.originalUrl!, "https://test.local");
    console.log("-->", req.method, url.pathname);
    const startTime = Date.now();
    res.once("close", () => {
      console.log(
        "<--",
        req.method,
        url.pathname,
        res.statusCode,
        formatDuration(Date.now() - startTime)
      );
    });
    next();
  };
}

function formatDuration(ms: number) {
  return ms < 1000 ? `${Math.floor(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}
