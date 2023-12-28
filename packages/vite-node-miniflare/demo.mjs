// @ts-check
import * as wrangler from "wrangler";

// node ./demo.mjs

async function main() {
  // TODO: how to cusomize "unsafeEvalBinding" and "bindings" to miniflare?
  // TODO: console.log proxy?

  const dev = await wrangler.unstable_dev("./demo-entry.mjs", {
    // TODO: cannot specify port...?
    // port: 8888
  });
  console.log(`:: starting at http://localhost:${dev.port}`);
  dev.fetch;
  dev.stop;
}

main();
