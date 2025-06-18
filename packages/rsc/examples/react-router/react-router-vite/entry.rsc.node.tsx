import { callServer } from "./entry.rsc";

export default async function handler(requrest: Request) {
  const entrySsr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");
  return entrySsr.default(requrest, callServer);
}
