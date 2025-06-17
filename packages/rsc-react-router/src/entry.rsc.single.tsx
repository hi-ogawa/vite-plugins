import { callServer } from "./entry.rsc";

export default async function handler(requrest: Request): Promise<Response> {
  const entrySsr = await import.meta.viteRsc.loadSsrModule<
    typeof import("./entry.ssr")
  >("index");
  return entrySsr.default(requrest, callServer);
}
