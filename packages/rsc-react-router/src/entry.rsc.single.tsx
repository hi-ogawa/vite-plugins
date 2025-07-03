import { fetchServer } from "./entry.rsc";

export default async function handler(requrest: Request): Promise<Response> {
  const ssr = await import.meta.viteRsc.loadModule<
    typeof import("./entry.ssr")
  >("ssr", "index");
  return ssr.default(requrest, fetchServer);
}
