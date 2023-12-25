// @ts-check
import * as wrangler from "wrangler";

// node ./demo.mjs

async function main() {
  // TODO: how to cusomize "unsafeEvalBinding" and "bindings" to miniflare?
  // TODO: console.log proxy?

  // TODO: fails since wrangler 3.19?
  // trace is from yoga-layout/dist/build/wasm-sync.js
  //   TypeError: fetch failed
  //     at fetch (/home/hiroshi/code/personal/vite-plugins/node_modules/.pnpm/undici@5.28.2/node_modules/undici/index.js:112:15)
  //     at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
  //     at async MessagePort.<anonymous> ([worker eval]:28:22) {
  //   [cause]: Error: connect ECONNREFUSED ::1:34591
  //       at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
  //   }
  // should be able to patch out whole ink/yoga dependency?

  const dev = await wrangler.unstable_dev("./demo-entry.mjs", {
    // experimental: {
    //   testMode: false,
    // }
  });
  console.log(`:: starting at http://localhost:${dev.port}`);
  dev.fetch;
  dev.stop;
}

main();
