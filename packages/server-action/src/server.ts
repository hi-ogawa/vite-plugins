import { tinyassert } from "@hiogawa/utils"

export function serverActionHandler({ request }: { request: Request; }) {
  request;
}

export async function decodeActionRequest(request: Request) {
  request;
}

export function importServerAction(id: string, name: string) {
  import(/* @vite-ignore */ id);
  import("virtual:server-action/references" as string);
}

export async function importServerReference(id: string) {
  if (import.meta.env.DEV) {
    return import(/* @vite-ignore */ id);
  } else {
    const mod = await import("virtual:server-action/references" as string);
    const dyn = mod.default[id];
    tinyassert(dyn);
    return dyn();
  }
}
