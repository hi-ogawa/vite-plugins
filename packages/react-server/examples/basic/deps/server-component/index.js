export async function TestDepServerComponent() {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return "TestDepServerComponent";
}
