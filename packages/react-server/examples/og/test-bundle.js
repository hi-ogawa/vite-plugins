// @ts-check

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseAstAsync } from "vite";

async function main() {
  const [arg = "esbuild"] = process.argv.slice(2);
  const entry = path.join(import.meta.dirname, "dist/server/index.js");

  if (arg === "nft") {
    const { nodeFileTrace } = await import("@vercel/nft");

    const result = await nodeFileTrace([entry], {
      // set pnpm project root to correctly traverse dependency
      base: path.join(import.meta.dirname, "../../../.."),
    });
    console.log(result.fileList);
    for (const [k, v] of result.reasons) {
      if (k.includes("@vercel/og")) {
        console.log(k, v);
      }
    }
  }

  if (arg === "ncc") {
    /** @type {any} */
    const { default: ncc } = await import("@vercel/ncc");

    const result = await ncc(entry, {
      filterAssetBase: path.join(import.meta.dirname, "../../../.."),
    });
    const outDir = path.join(import.meta.dirname, "dist/ncc");
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.js"), result.code);
    for (const [name, { source }] of Object.entries(result.assets)) {
      await writeFile(path.join(outDir, name), source);
    }
  }

  if (arg === "esbuild") {
    const esbuild = await import("esbuild");

    await esbuild.build({
      entryPoints: [entry],
      outdir: path.join(import.meta.dirname, "dist/esbuild"),
      bundle: true,
      format: "esm",
      platform: "node",
      define: {
        "process.env.NODE_ENV": `"production"`,
      },
      // split dynamic import like rollup/down
      // splitting: true,
      logLevel: "info",
      logOverride: {
        "ignored-bare-import": "silent",
      },
    });
  }

  if (arg === "rolldown") {
    const rolldown = await import("rolldown");
    const { default: replace } = await import("@rollup/plugin-replace");

    const bundle = await rolldown.rolldown({
      input: entry,
      platform: "node",
      plugins: [
        // @ts-ignore rollup/rolldown plugin type
        replace({
          preventAssignment: true,
          values: {
            "process.env.NODE_ENV": `"production"`,
          },
        }),
      ],
    });
    const outDir = path.join(import.meta.dirname, "dist/rolldown");
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
    await bundle.write({
      dir: outDir,
    });
    await bundle.destroy();
    // seems necessary to force exit
    // https://github.com/rolldown/rolldown/pull/1097
    // https://github.com/rolldown/rolldown/pull/985
    process.exit(0);
  }

  if (arg === "rolldown-scan") {
    const rolldown = await import("rolldown");
    const { default: replace } = await import("@rollup/plugin-replace");
    const { asyncWalk } = await import("estree-walker");
    const staticEval = await import("@vercel/nft/out/utils/static-eval.js");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    /** @type {string[]} */
    const files = [];
    await rolldown.experimental_scan({
      input: entry,
      platform: "node",
      plugins: [
        // @ts-ignore rollup/rolldown plugin type
        replace({
          preventAssignment: true,
          values: {
            "process.env.NODE_ENV": `"production"`,
          },
        }),
        {
          name: "trace-asset",
          async transform(code, id) {
            files.push(id);

            if (code.includes("fs.readFileSync")) {
              const ast = await parseAstAsync(code);
              asyncWalk(ast, {
                async enter(node) {
                  // detect asset reference of this form, which is used by node build of @vercel/og
                  //   fs.readFileSync(fileURLToPath(join(import.meta.url, "....")))
                  if (
                    node.type === "CallExpression" &&
                    node.arguments.length > 0
                  ) {
                    // https://github.com/vercel/nft/blob/099608f28ba1af5b8f6f98ac5ab05261ad45b42f/src/analyze.ts#L446-L458
                    const callee = await staticEval.evaluate(node.callee, {
                      fs: {
                        value: {
                          readFileSync: Symbol.for("asset-trigger"),
                        },
                      },
                    });
                    if (callee?.value === Symbol.for("asset-trigger")) {
                      const argNode = node.arguments[0];
                      console.log(argNode);

                      // not working...
                      const argValue = await staticEval.evaluate(argNode, {
                        "import.meta": {
                          url: id,
                        },
                        fileURLToPath: {
                          value: { [staticEval.FUNCTION]: fileURLToPath },
                        },
                        join: {
                          value: { [staticEval.FUNCTION]: path.join },
                        },
                      });
                      console.log(argValue);
                    }
                  }
                },
              });
            }
          },
        },
      ],
    });
    // console.log(files.sort());
    process.exit(0);
  }

  if (arg === "rollup") {
    const rollup = await import("rollup");
    const { default: replace } = await import("@rollup/plugin-replace");
    const { default: nodeResolve } = await import(
      "@rollup/plugin-node-resolve"
    );
    const { default: commonjs } = await import("@rollup/plugin-commonjs");

    console.time("[rollup]");
    const bundle = await rollup.rollup({
      input: entry,
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            "process.env.NODE_ENV": `"production"`,
          },
        }),
        nodeResolve(),
        commonjs(),
      ],
    });
    console.timeEnd("[rollup]");
    const outDir = path.join(import.meta.dirname, "dist/rollup");
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
    console.time("[bundle.write]");
    await bundle.write({
      dir: outDir,
      // bundle dynamic import like esbuild without splitting
      // inlineDynamicImports: true,
    });
    console.timeEnd("[bundle.write]");
  }
}

main();
