"use server";

export let serverCounter = 0;

export async function changeServerCounter(formData: FormData): Promise<void> {
  serverCounter += Number(formData.get("change"));
}
