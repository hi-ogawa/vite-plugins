import { tinyassert } from "@hiogawa/utils";

export function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

export async function fetchJson(
  ...args: Parameters<typeof fetch>
): Promise<unknown> {
  const res = await fetch(...args);
  tinyassert(res.ok);
  return res.json();
}
