import type vm from "node:vm";

const runInThisContext: typeof vm.runInThisContext = (code) => {
  console.log({ code });
  // @ts-ignore
  return env.UNSAFE_EVAL.eval(code);
};

export default {
  runInThisContext,
};
