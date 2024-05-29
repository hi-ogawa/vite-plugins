"use server";

export let count1 = 0;

export function changeCount1(formData: FormData) {
  count1 += Number(formData.get("value"));
}
