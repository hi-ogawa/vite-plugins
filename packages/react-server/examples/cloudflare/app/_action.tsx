"use server";

import { getPlatform } from "next/cloudflare";

const kv = () => getPlatform<Env>().env.kv;

export async function getCount() {
  const count = Number(await kv().get("count"));
  return Number.isInteger(count) ? count : 0;
}

export async function changeCount(formData: FormData) {
  const count = await getCount();
  const change = Number(formData.get("change"));
  await kv().put("count", String(count + change));
}
