"use server";

let count1 = 0;

export async function getCount1() {
  return count1;
}

export async function changeCount1(formData: FormData) {
  count1 += Number(formData.get("value"));
}
