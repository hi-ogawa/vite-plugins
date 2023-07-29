import { describe, expect, it } from "vitest";
import { jwsSign, jwsVerify } from "./jws";

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
