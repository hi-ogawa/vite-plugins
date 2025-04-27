// `base` is a build constant, but technically we could support it as runtime option instead.
// As an (odd) convention, internally url is always prefix with "/" only on dev.
const base = import.meta.env.DEV
  ? import.meta.env.BASE_URL.slice(0, -1)
  : import.meta.env.BASE_URL;

export function withBase(url: string): string {
  return base + url;
}
