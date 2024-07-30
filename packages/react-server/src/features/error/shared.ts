// TODO: custom (de)serialization?
export interface ReactServerErrorContext {
  status: number;
  headers?: Record<string, string>;
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

export function redirect(
  location: string,
  options?: { status?: number; headers?: Record<string, string> },
) {
  return createError({
    status: options?.status ?? 302,
    headers: {
      ...options?.headers,
      location,
    },
  });
}

export function isRedirectError(ctx: ReactServerErrorContext) {
  const location = ctx.headers?.["location"];
  if (300 <= ctx.status && ctx.status <= 399 && typeof location === "string") {
    return { location };
  }
  return false;
}

export function isRedirectStatus(status: number) {
  return 300 <= status && status <= 399;
}

export function isNotFoundError(ctx: ReactServerErrorContext) {
  return ctx.status === 404;
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
        console.error(e);
      }
    }
  }
  return;
}

export const DEFAULT_ERROR_CONTEXT: ReactServerErrorContext = { status: 500 };

const STATUS_TEXT_MAP = new Map([
  [400, "Bad Request"],
  [403, "Forbidden"],
  [404, "Not Found"],
  [500, "Internal Server Error"],
]);

export function getStatusText(status: number) {
  return STATUS_TEXT_MAP.get(status) ?? "Unknown Server Error";
}
