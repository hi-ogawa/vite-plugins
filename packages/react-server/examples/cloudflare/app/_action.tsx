"use server";

import { getPlatform } from "next/cloudflare";

const kv = () => getPlatform<Env>().env.kv;

export async function changeCount() {
  await kv().put("count", String((await getCount()) + 1));
}

export async function getCount() {
  const count = Number(await kv().get("count"));
  return Number.isInteger(count) ? count : 0;
}
