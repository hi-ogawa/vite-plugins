import { tinyassert } from "@hiogawa/utils";
import * as cookieLib from "cookie";
import * as z from "valibot";

// mini cookie utils

const sessionSchema = z.object({
  user: z.optional(
    z.object({
      name: z.string(),
    }),
  ),
});

type SessionData = z.Output<typeof sessionSchema>;

const SESSION_KEY = "__session";

export function getSession(request: Request): SessionData | undefined {
  const raw = request.headers.get("cookie");
  if (raw) {
    const parsed = cookieLib.parse(raw);
    const token = parsed[SESSION_KEY];
    if (token) {
      try {
        const data = JSON.parse(decodeURIComponent(token));
        return z.parse(sessionSchema, data);
      } catch (e) {
        console.error(e);
      }
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
