import { ResponseCookies } from "@edge-runtime/cookies";

/** @todo https://nextjs.org/docs/app/api-reference/functions/headers */
export function headers() {
  return new Headers();
}

/** @todo https://nextjs.org/docs/app/api-reference/functions/cookies */
export function cookies() {
  return new ResponseCookies(new Headers());
}

/** @todo */
export function draftMode() {
  return {} as any;
}
