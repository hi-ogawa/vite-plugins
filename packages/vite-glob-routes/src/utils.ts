export function mapKeys<T>(
  record: Record<string, T>,
  f: (k: string) => string
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [f(k), v] as const)
  );
}

export function mapValues<T, T2>(
  record: Record<string, T>,
  f: (v: T) => T2
): Record<string, T2> {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k, f(v)] as const)
  );
}
