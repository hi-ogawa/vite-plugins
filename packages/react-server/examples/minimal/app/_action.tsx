"use server";

let count = 0;

export async function changeCount() {
  count++;
}

export function getCount() {
  return count;
}
