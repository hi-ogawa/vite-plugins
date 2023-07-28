import { describe, expect, it } from "vitest";
import { jwsSign, jwsVerify } from "./jws";

describe("jws", () => {
  it("basic", async () => {
    const secret = "asdfjkl;asdfjkl;asdfjkl;";
    const token = await jwsSign({
      header: { alg: "HS256" },
      payload: { hello: "world", utf: "콘솔🐈" },
      secret,
    });
    expect(token).toMatchInlineSnapshot(
      '"eyJhbGciOiJIUzI1NiJ9.eyJoZWxsbyI6IndvcmxkIiwidXRmIjoi7L2Y7IaU8J-QiCJ9.1PVKyDo4Ew2zzdR9yUfGic2J8yddS5KJHUrBpYcjtao"'
    );

    const verified = await jwsVerify({ token, secret, algorithms: ["HS256"] });
    expect(verified).toMatchInlineSnapshot(`
      {
        "payload": {
          "hello": "world",
          "utf": "콘솔🐈",
        },
      }
    `);
  });
});
