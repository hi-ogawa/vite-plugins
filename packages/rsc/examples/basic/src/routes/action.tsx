"use server";

let serverCounter = 0;

export function getServerCounter() {
  return serverCounter;
}

export async function changeServerCounter(formData: FormData): Promise<void> {
  const TEST_UPDATE = 1;
  serverCounter += Number(formData.get("change")) * TEST_UPDATE;
}

export async function resetServerCounter(): Promise<void> {
  serverCounter = 0;
}
