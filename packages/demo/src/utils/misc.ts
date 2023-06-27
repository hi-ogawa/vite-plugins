export function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
