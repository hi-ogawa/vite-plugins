import type { RequestHandler } from "@hattip/compose";
import { jweDecrypt, jweEncrypt } from "@hiogawa/tiny-jwt";
import { tinyassert, wrapErrorAsync } from "@hiogawa/utils";
import * as cookieLib from "cookie";
import { z } from "zod";

// session api exposed via request context

const Z_SESSION_DATA = z.object({
  user: z
    .object({
      name: z.string(),
    })
    .optional(),
});

export type SessionData = z.infer<typeof Z_SESSION_DATA>;

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    session: SessionData;
    commitSession: () => Promise<void>;
  }
}

//
// jwt cookie session
//

export function sessionHandler(): RequestHandler {
  return async (ctx) => {
    ctx.session = await readCookieSession(
      ctx.request.headers.get("cookie") ?? undefined
    );

    let setCookie: string | undefined;
    ctx.commitSession = async () => {
      setCookie = await writeCookieSession(ctx.session);
    };

    const res = await ctx.next();
    if (setCookie) {
      res.headers.set("set-cookie", setCookie);
    }
    return res;
  };
}

const COOKIE_SESSION_KEY = "__session";

// npx -C packages/demo tiny-jwt keygen A256GCM
const JWT_KEY = {
  kty: "oct",
  k: "pv0EsIhwGw6d2tdtRJP4DQWLrlr_9H9STjoKyzopONY", // this should be runtime secret
};

async function readCookieSession(cookie?: string): Promise<SessionData> {
  if (cookie) {
    const cookieRecord = cookieLib.parse(cookie);
    const token = cookieRecord[COOKIE_SESSION_KEY];
    if (token) {
      const parsed = await wrapErrorAsync(async () => {
        const verified = await jweDecrypt({
          token,
          key: JWT_KEY,
        });
        return Z_SESSION_DATA.parse(verified.payload);
      });
      if (parsed.ok) {
        return parsed.value;
      }
    }
  }
  return {};
}

// also used for testing
export async function writeCookieSession(
  session: SessionData
): Promise<string> {
  const token = await jweEncrypt({
    header: { alg: "dir", enc: "A256GCM" },
    payload: session,
    key: JWT_KEY,
  });
  const cookie = cookieLib.serialize(COOKIE_SESSION_KEY, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  tinyassert(cookie.length < 2 ** 12, "too large cookie session");
  return cookie;
}
