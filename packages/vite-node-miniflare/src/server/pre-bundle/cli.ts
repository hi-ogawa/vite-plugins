import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { preBundle } from "./utils";

async function main() {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      outDir: {
        type: "string",
        default: path.join(
          process.cwd(),
          "node_modules/.cache/@hiogawa/vite-node-miniflare/pre-bundle"
        ),
      },
    },
  });
  await preBundle(args.positionals, args.values.outDir!);
}

main();
