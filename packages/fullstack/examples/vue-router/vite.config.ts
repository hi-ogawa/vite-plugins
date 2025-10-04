import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import fullstack from "@hiogawa/vite-plugin-fullstack";
// import inspect from "vite-plugin-inspect";
import vue from "@vitejs/plugin-vue";
import { type Plugin, type ResolvedConfig, defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";

export default defineConfig((_env) => ({
  clearScreen: false,
  plugins: [
    // inspect(),
    vue(),
    devtoolsJson(),
    fullstack(),
    !!process.env.TEST_SSG &&
      ssgPlugin({
        paths: ["/", "/about"],
      }),
  ],
  optimizeDeps: {
    entries: ["src/framework/entry.client.ts"],
  },
  environments: {
    client: {
      build: {
        outDir: "./dist/client",
      },
    },
    ssr: {
      build: {
        outDir: "./dist/ssr",
        rollupOptions: {
          input: {
            index: "./src/framework/entry.server.ts",
          },
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments["ssr"]!);
      await builder.build(builder.environments["client"]!);
    },
  },
}));

type SsgPluginOptions = {
  paths: string[];
};

function ssgPlugin(pluginOpts: SsgPluginOptions): Plugin {
  return {
    name: "ssg",
    buildApp: {
      order: "post",
      async handler(builder) {
        await renderStatic(pluginOpts, builder.config);
      },
    },
  };
}

async function renderStatic(
  pluginOpts: SsgPluginOptions,
  config: ResolvedConfig,
) {
  console.log("[ssg] started");

  // import server entry
  const entryPath = path.join(config.environments.ssr.build.outDir, "index.js");
  const entry: typeof import("./src/framework/entry.server") = await import(
    pathToFileURL(entryPath).href
  );

  // render html
  const baseDir = config.environments.client.build.outDir;
  for (const staticPatch of pluginOpts.paths) {
    config.logger.info(" -> " + staticPatch);
    const response = await entry.default.fetch(
      new Request(new URL(staticPatch, "http://ssg.local")),
    );
    await writeFileStream(
      path.join(baseDir, normalizeHtmlFilePath(staticPatch)),
      response.body!,
    );
  }
  console.log("[ssg] finished in (TODO) ms");
}

async function writeFileStream(filePath: string, stream: ReadableStream) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, Readable.fromWeb(stream as any));
}

function normalizeHtmlFilePath(p: string) {
  if (p.endsWith("/")) {
    return p + "index.html";
  }
  return p + ".html";
}
