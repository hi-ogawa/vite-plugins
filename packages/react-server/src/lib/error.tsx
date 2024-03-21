import { debug } from "./debug";

// TODO: allow including arbitrary data?
// TODO: accomodate redirection error convention?
export interface ReactServerErrorContext {
  status: number;
}

export class ReactServerDigestError extends Error {
  constructor(public digest: string) {
    super("ReactServerError");
  }
}

export function createError(ctx: ReactServerErrorContext) {
  const digest = `__REACT_SERVER_ERROR__:${JSON.stringify(ctx)}`;
  return new ReactServerDigestError(digest);
}

export function getErrorContext(
  error: unknown,
): ReactServerErrorContext | undefined {
  if (
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    const m = error.digest.match(/^__REACT_SERVER_ERROR__:(.*)$/);
    if (m && m[1]) {
      try {
        return JSON.parse(m[1]);
      } catch (e) {
        debug("[getErrorContext]", e);
      }
    }
  }
  return;
}
