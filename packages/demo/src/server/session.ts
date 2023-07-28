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

const SESSION_DATA_DEFAULT = Z_SESSION_DATA.parse({});

type SessionData = z.infer<typeof Z_SESSION_DATA>;

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    session: SessionData;
    commitSession: () => Promise<void>;
  }
}

//
// toy cookie session
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

    // TODO: check status?
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
    const value = cookieRecord[COOKIE_SESSION_KEY];
    if (value) {
      const parsed = await wrapErrorAsync(async () => {
        const verified = await jwsVerify({
          token: value,
          algorithms: ["HS256"],
          secret: JWS_SECRET,
        });
        return Z_SESSION_DATA.parse(verified.payload);
      });
      if (parsed.ok) {
        return parsed.value;
      }
    }
  }
  return SESSION_DATA_DEFAULT;
}

async function writeCookieSession(session: SessionData): Promise<string> {
  const token = await jwsSign({
    header: { alg: "HS256" },
    payload: session,
    secret: JWS_SECRET,
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
