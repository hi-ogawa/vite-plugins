"use server";

import { sleep } from "@hiogawa/utils";

let counter = 0;

export function getCounter() {
  return counter;
}

export async function changeCounter(formData: FormData) {
  const delta = Number(formData.get("delta"));
  if (delta === -1) {
    await sleep(2000);
  } else {
    await sleep(200);
  }
  counter += delta;
}
