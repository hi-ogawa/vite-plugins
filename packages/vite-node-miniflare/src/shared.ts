export const RUNNER_INIT_PATH = "/__viteInit";
export const RUNNER_EVAL_PATH = "/__viteEval";
export const ANY_URL = "https://any.local";

export type RunnerEnv = {
  __viteUnsafeEval: {
    eval: (code: string, filename?: string) => any;
  };
  __viteFetchModule: {
    fetch: (request: Request) => Promise<Response>;
  };
  __viteRunner: DurableObject;
  __viteOptions: {
    root: string;
    hmr: boolean;
  };
};

export type FetchMetadata = {
  entry: string;
};
