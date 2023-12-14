import { parseArgs } from "node:util";
import { preBundle } from "./utils";

async function main() {
  const args = parseArgs({
    allowPositionals: true,
    options: {
      outDir: {
        type: "string",
        default: "node_modules/.cache/@hiogawa/vite-node-miniflare/pre-bundle",
      },
    },
  });
  await preBundle(args.positionals, args.values.outDir!);
}

main();
