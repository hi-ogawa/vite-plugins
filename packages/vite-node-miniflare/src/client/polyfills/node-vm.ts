import type vm from "node:vm";

let __unsafeEval: any;

export function __setUnsafeEval(v: any) {
  __unsafeEval = v;
}

// Workerd's unsafe eval supports 2nd argument for stacktrace filename
// https://github.com/cloudflare/workerd/blob/5e2544fd2948b53e68831a9b219dc1e9970cf96f/src/workerd/api/unsafe.c%2B%2B#L18-L23
// https://github.com/cloudflare/workerd/pull/1338
// https://github.com/vitest-dev/vitest/blob/8dabef860a3f51f5a4c4debc10faa1837fdcdd71/packages/vite-node/src/client.ts#L414
// https://nodejs.org/docs/latest/api/vm.html#vmrunincontextcode-contextifiedobject-options
const runInThisContext: typeof vm.runInThisContext = (code, options) => {
  return __unsafeEval.eval(code, (options as any).filename);
};

export default {
  runInThisContext,
};
