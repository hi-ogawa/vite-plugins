"use server";

import { getPlatform } from "next/vite/platform";

const kv = () => getPlatform().env.kv;

export async function getCount() {
  const count = Number(await kv().get("count"));
  return Number.isInteger(count) ? count : 0;
}

export async function changeCount(formData: FormData) {
  const count = await getCount();
  const change = formData.get("change") === "+1" ? 1 : -1;
  await kv().put("count", String(count + change));
}
