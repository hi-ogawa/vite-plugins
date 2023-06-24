export function cls(...args: unknown[]): string {
  return args.filter(Boolean).join(" ");
}
