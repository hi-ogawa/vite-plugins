// "base" is a build constant, but technically we could support it as runtime option instead.
// internally url is ensured to be prefixed with `/`, so slice trailing slash from `BASE_URL`.
const base = import.meta.env.BASE_URL.slice(0, -1);

export function withBase(url: string): string {
  return base + url;
}
