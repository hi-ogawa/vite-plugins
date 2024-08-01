import type { ModuleRunner } from "vite/module-runner";

export const RUNNER_INIT_PATH = "/__viteInit";
export const RUNNER_EVAL_PATH = "/__viteEval";
export const ANY_URL = "https://any.local";

export type RunnerEnv = {
  __viteRoot: string;
  __viteUnsafeEval: {
    eval: (code: string, filename?: string) => any;
  };
  __viteFetchModule: {
    fetch: (request: Request) => Promise<Response>;
  };
  __viteRunner: DurableObject;
};

export type FetchMetadata = {
  entry: string;
};

export type EvalFn<In = any, Out = any> = (ctx: {
  mod: any;
  data?: In;
  env: any;
  runner: ModuleRunner;
}) => Promise<Out> | Out;

export type EvalApi = <In = any, Out = any>(request: {
  entry: string;
  data?: In;
  fn: EvalFn<In, Out>;
}) => Promise<Awaited<Out>>;

export type EvalMetadata = {
  entry: string;
  fnString: string;
};
