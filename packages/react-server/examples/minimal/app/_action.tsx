"use server";

let count = 0;

export async function changeCount() {
  count++;
}

export async function getCount() {
  return count;
}
