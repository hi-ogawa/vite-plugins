import {
  createError,
  redirect as redirect_,
} from "@hiogawa/react-server/server";

export function notFound(): never {
  throw createError({ status: 404 });
}

/** @todo */
export enum RedirectType {
  push = "push",
  replace = "replace",
}

export function redirect(url: string, ..._args: unknown[]): never {
  throw redirect_(url);
}

export function permanentRedirect(url: string, ..._args: unknown[]): never {
  throw redirect_(url, { status: 308 });
}
