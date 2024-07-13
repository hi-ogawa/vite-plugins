import path from "node:path";
import { nodeFileTrace } from "@vercel/nft";

async function main() {
  const [arg = "esbuld"] = process.argv.slice(2);

  if (arg === "nft") {
    const result = await nodeFileTrace(
      [path.join(import.meta.dirname, "dist/server/index.js")],
      {
        // set pnpm project root to correctly traverse dependency
        base: path.join(import.meta.dirname, "../../../.."),
      },
    );
    console.log(result);
  }

  if (arg === "rolldown") {
  }
}

main();
