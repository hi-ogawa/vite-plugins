import * as reactServerSsr from "@hiogawa/react-server/ssr";

// TODO: abstract too much

export async function handler(request: Request): Promise<Response> {
  return reactServerSsr.handler(request);
}
