import type { RequestHandler } from "@hattip/compose";
import { tinyassert, wrapErrorAsync } from "@hiogawa/utils";
import * as cookieLib from "cookie";
import { z } from "zod";
import { jwsSign, jwsVerify } from "../utils/jws";

// session api exposed via request context

const Z_SESSION_DATA = z.object({
  user: z
    .object({
      name: z.string(),
    })
    .optional(),
});

type SessionData = z.infer<typeof Z_SESSION_DATA>;

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    session: SessionData;
    commitSession: () => Promise<void>;
  }
}

//
// jws cookie session
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
const JWS_SECRET = "__secret";

async function readCookieSession(cookie?: string): Promise<SessionData> {
  if (cookie) {
    const cookieRecord = cookieLib.parse(cookie);
    const token = cookieRecord[COOKIE_SESSION_KEY];
    if (token) {
      const parsed = await wrapErrorAsync(async () => {
        const verfied = await jwsVerify({
          token: token,
          secret: JWS_SECRET,
        });
        return Z_SESSION_DATA.parse(verfied);
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
  const token = await jwsSign({ payload: session, secret: JWS_SECRET });
  const cookie = cookieLib.serialize(COOKIE_SESSION_KEY, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  tinyassert(cookie.length < 2 ** 12, "too large cookie session");
  return cookie;
}
