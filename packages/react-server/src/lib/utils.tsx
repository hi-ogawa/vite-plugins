/**
 * @example
 * "/hello/world" =>
 *    [
 *      ["",             ""],
 *      ["/hello",       "hello"],
 *      ["/hello/world", "world"],
 *    ]
 */
export function getPathPrefixes(pathname: string) {
  const keys = normalizePathname(pathname).split("/");
  return keys.map((key, i) => [keys.slice(0, i + 1).join("/"), key] as const);
}

// strip trailing slash (including "/" => "")
export function normalizePathname(pathname: string) {
  return pathname.replaceAll(/\/*$/g, "");
}
