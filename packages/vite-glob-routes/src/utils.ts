export function mapKeys<T>(
  record: Record<string, T>,
  f: (k: string) => string
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [f(k), v] as const)
  );
}
