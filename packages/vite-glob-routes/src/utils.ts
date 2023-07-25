import { escapeRegExp, mapRegExp, tinyassert, zip } from "@hiogawa/utils";

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

/**
 * regex matcher for dynamic route e.g. /fixed/[dynamic]/[one-more]
 */
export function createParamMatcher(pattern: string): ParamMater {
  // fast path for non-dynamic route
  if (!pattern.includes("[")) {
    return (input: string) => (input === pattern ? { params: {} } : undefined);
  }

  const paramNames: string[] = [];
  const parts: string[] = [];

  mapRegExp(
    pattern,
    /\[(.*?)\]/g,
    (match) => {
      // TODO: warn prototype pollution?
      const name = match[1];
      tinyassert(name);
      paramNames.push(name);
      parts.push("([^/]*?)"); // non-greedy match except "/"
    },
    (nonMatch) => {
      parts.push(escapeRegExp(nonMatch));
    }
  );

  const re = new RegExp("^" + parts.join("") + "$");

  const matcher: ParamMater = (input: string) => {
    const match = input.match(re);
    if (match) {
      tinyassert(match.length === paramNames.length + 1);
      const params = Object.fromEntries(zip(paramNames, match.slice(1)));
      return { params };
    }
    return;
  };
  return matcher;
}

type ParamMater = (input: string) =>
  | {
      params: Record<string, string>;
    }
  | undefined;
