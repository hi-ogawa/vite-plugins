"use server";

let counter = 0;

export function getCounter() {
  return counter;
}

export function changeCounter(formData: FormData) {
  counter += Number(formData.get("delta"));
}
