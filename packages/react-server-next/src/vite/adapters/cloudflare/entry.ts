import { handler } from "@hiogawa/react-server/entry/ssr";

function fetch(request: Request, env: Record<string, any>) {
  Object.assign(process.env, env);
  return handler(request);
}

export default { fetch };
