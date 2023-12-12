export let env: {
  __UNSAFE_EVAL: any;
  __VITE_NODE_RPC_URL: string;
  __VITE_NODE_ROOT: string;
  __WORKER_ENTRY: string;
};

export function setEnv(_env: any) {
  env = _env;
}
