"use server";

export async function testAction(formData: FormData): Promise<void> {
  console.log("[testAction]", formData);
}
