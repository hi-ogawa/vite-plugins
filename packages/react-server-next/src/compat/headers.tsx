import { ResponseCookies } from "@edge-runtime/cookies";

/** @todo */
export function headers() {
  return new Headers();
}

/** @todo */
export function cookies() {
  return new ResponseCookies(new Headers());
}

/** @todo */
export function draftMode() {
  return {} as any;
}
