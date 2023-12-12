import type vm from "node:vm";
import { env } from "../env";

const runInThisContext: typeof vm.runInThisContext = (code) => {
  return env.__UNSAFE_EVAL.eval(code);
};

export default {
  runInThisContext,
};
