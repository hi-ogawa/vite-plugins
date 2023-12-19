// test stack trace follows multiple files correctly
export function crash(message: string): never {
  throw new Error(message);
}
