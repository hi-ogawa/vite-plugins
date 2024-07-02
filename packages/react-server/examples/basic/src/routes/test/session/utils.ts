import { objectHas, tinyassert } from "@hiogawa/utils";
import * as cookieLib from "cookie";

// mini cookie session utils

type SessionData = {
  name?: string;
};

export const SESSION_KEY = "__session";

export function getSession(headers: Headers): SessionData | undefined {
  const raw = headers.get("cookie");
  if (raw) {
    const parsed = cookieLib.parse(raw);
    const token = parsed[SESSION_KEY];
    if (token) {
      try {
        const data = JSON.parse(decodeURIComponent(token));
        tinyassert(objectHas(data, "name"));
        tinyassert(typeof data.name === "string");
        return { name: data.name };
      } catch (e) {}
    }
  }
}

export function setSession(data: SessionData) {
  const token = encodeURIComponent(JSON.stringify(data));
  const cookie = cookieLib.serialize(SESSION_KEY, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 14 * 24 * 60 * 60, // two week
  });
  tinyassert(cookie.length < 2 ** 12, "too large cookie session");
  return cookie;
}
