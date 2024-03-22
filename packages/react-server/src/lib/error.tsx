import { debug } from "./debug";

// TODO: accomodate redirection error convention?
// TODO: custom (de)serialization?
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

const STATUS_TEXT_MAP = new Map([
  [400, "Bad Request"],
  [403, "Forbidden"],
  [404, "Not Found"],
  [500, "Internal Server Error"],
]);

export function getStatusText(status: number) {
  return STATUS_TEXT_MAP.get(status) ?? "Unknown Server Error";
}
