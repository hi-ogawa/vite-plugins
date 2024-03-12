"use server";

export async function hello(formData: FormData) {
  console.log("[action] hello", { formData });
}
