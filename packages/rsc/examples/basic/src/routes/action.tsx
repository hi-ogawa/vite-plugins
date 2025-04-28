"use server";

export let serverCounter = 0;

export async function changeServerCounter(formData: FormData): Promise<void> {
  const TEST_UPDATE = 1;
  serverCounter += Number(formData.get("change")) * TEST_UPDATE;
}

export async function resetServerCounter(): Promise<void> {
  serverCounter = 0;
}

export async function testServerActionError() {
  throw new Error("testServerActionError");
}
