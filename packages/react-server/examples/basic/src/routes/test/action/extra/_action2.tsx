"use server";

// this server file is only imported by client

let count3 = 0;

export function changeCount3(_value: unknown, formData: FormData) {
  count3 += Number(formData.get("value"));
  return count3;
}
