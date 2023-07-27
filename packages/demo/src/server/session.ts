import type { RequestHandler } from "@hattip/compose";
import { tinyassert, wrapError } from "@hiogawa/utils";
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

const SESSION_DATA_DEFAULT = Z_SESSION_DATA.parse({});

type SessionData = z.infer<typeof Z_SESSION_DATA>;

declare module "@hattip/compose" {
  interface RequestContextExtensions {
    session: SessionData;
    commitSession: () => void;
  }
}

//
// toy cookie session
//

export function sessionHandler(): RequestHandler {
  return async (ctx) => {
    ctx.session = readCookieSession(
      ctx.request.headers.get("cookie") ?? undefined
    );

    let setCookie: string | undefined;
    ctx.commitSession = () => {
      setCookie = writeCookieSession(ctx.session);
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

function readCookieSession(cookie?: string): SessionData {
  if (cookie) {
    const cookieRecord = cookieLib.parse(cookie);
    const value = cookieRecord[COOKIE_SESSION_KEY];
    if (value) {
      const parsed = wrapError(() =>
        Z_SESSION_DATA.parse(JSON.parse(decodeURIComponent(value)))
      );
      if (parsed.ok) {
        return parsed.value;
      }
    }
  }
  return SESSION_DATA_DEFAULT;
}

function writeCookieSession(session: SessionData): string {
  const cookie = cookieLib.serialize(
    COOKIE_SESSION_KEY,
    encodeURIComponent(JSON.stringify(session)),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    }
  );
  tinyassert(cookie.length < 2 ** 12, "too large cookie session");
  return cookie;
}
