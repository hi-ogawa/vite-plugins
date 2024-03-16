import type { RequestContext } from "@hattip/compose";
import { describe, expect, it } from "vitest";
import { requestContextStorage } from "../server/request-context";
import { type SessionData, writeCookieSession } from "../server/session";
import { rpcRoutes } from "./server";

describe("rpcServer", () => {
  it("me", async () => {
    await withoutSession(async () => {
      expect(await rpcRoutes.me()).toMatchInlineSnapshot("null");
    });

    await withSession(async () => {
      expect(await rpcRoutes.me()).toMatchInlineSnapshot(`
      {
        "name": "abcd",
      }
    `);
    });
  });
});

// mock async storage
function mockRequestContext(options?: { session?: SessionData }) {
  return async (f: () => void | Promise<void>) => {
    const request = new Request("http://__dummy.local");
    if (options?.session) {
      const cookie = await writeCookieSession(options.session);
      request.headers.set("cookie", cookie);
    }
    // don't have mock everything yet
    const ctx: Pick<RequestContext, "request" | "session"> = {
      request,
      session: options?.session ?? {},
    };
    return requestContextStorage.run(ctx as any, () => f());
  };
}

const withoutSession = mockRequestContext();
const withSession = mockRequestContext({
  session: { user: { name: "abcd" } },
});
