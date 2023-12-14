import type vm from "node:vm";

let __unsafeEval: any;

export function __setUnsafeEval(v: any) {
  __unsafeEval = v;
}

const runInThisContext: typeof vm.runInThisContext = (code) => {
  return __unsafeEval.eval(code);
};

export default {
  runInThisContext,
};
