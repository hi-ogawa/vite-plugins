import crypto from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { jwsSign, jwsVerify } from "./jws";

// crypto.subtle is globally available on cloudflare workers and "node:crypto" is not import-able.
beforeAll(async () => {
  (globalThis as any).crypto = crypto;
  return () => {
    delete (globalThis as any).crypto;
  };
});

describe("jws", () => {
  it("basic", async () => {
    const secret = "asdfjkl;asdfjkl;asdfjkl;";
    const token = await jwsSign({
      payload: { hello: "world", utf: "콘솔🐈" },
      secret,
    });
    expect(token).toMatchInlineSnapshot(
      '"eyJhbGciOiJIUzI1NiJ9.eyJoZWxsbyI6IndvcmxkIiwidXRmIjoi7L2Y7IaU8J-QiCJ9.yzZprGiBk6Jz4b1DRY9fzBkH5FedTp3DqPxZWkFtkso"'
    );

    const verified = await jwsVerify({ token, secret });
    expect(verified).toMatchInlineSnapshot(`
      {
        "hello": "world",
        "utf": "콘솔🐈",
      }
    `);
  });
});
