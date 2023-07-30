//
// quick-and-dirty jws
//
// cf.
// https://github.com/remix-run/remix/blob/100ecd3ea686eeec14f17fa908116b74aebdb91c/packages/remix-cloudflare/crypto.ts#L14-L21
// https://github.com/auth0/node-jws/blob/b9fb8d30e9c009ade6379f308590f1b0703eefc3/lib/sign-stream.js
// https://github.com/panva/jose/blob/e2836e6aaaddecde053018884abb040908f186fd/src/runtime/browser/sign.ts
//

// indulge in cloudflare workers's node compat...
// https://developers.cloudflare.com/workers/runtime-apis/nodejs/#nodejs-compatibility
// https://vercel.com/docs/concepts/functions/edge-functions/edge-runtime#supported-apis
import { Buffer } from "node:buffer";
// import crypto from "node:crypto"; // crypto.subtle available globally

import { tinyassert } from "@hiogawa/utils";

const JWS_HEADER = { alg: "HS256" }; // hard-coded header
const CRYPTO_ALGORITHM = { name: "HMAC", hash: "SHA-256" };

export async function jwsSign({
  payload,
  secret,
}: {
  payload: unknown;
  secret: string;
}) {
  const headerString = encodePayload(JWS_HEADER);
  const payloadString = encodePayload(payload);
  const signatureBin = await cryptoSign({
    data: Buffer.from(payloadString),
    keyData: Buffer.from(secret),
    algorithm: CRYPTO_ALGORITHM,
  });
  const signatureString = Buffer.from(signatureBin).toString("base64url");
  const token = `${headerString}.${payloadString}.${signatureString}`;
  return token;
}

export async function jwsVerify({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): Promise<unknown> {
  const {
    0: headerString, // ignore header
    1: payloadString,
    2: signatureString,
    length,
  } = token.split(".");
  tinyassert(
    headerString && payloadString && signatureString && length === 3,
    "invalid token format"
  );

  const isValid = await cryptoVerify({
    data: Buffer.from(payloadString),
    keyData: Buffer.from(secret),
    signature: Buffer.from(signatureString, "base64url"),
    algorithm: CRYPTO_ALGORITHM,
  });
  tinyassert(isValid, "invalid signature");

  return decodePayload(payloadString);
}

function encodePayload(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(payloadString: string): unknown {
  return JSON.parse(Buffer.from(payloadString, "base64url").toString());
}

//
// webcrypto wrapper
//

async function cryptoSign({
  data,
  keyData,
  algorithm,
}: {
  data: BufferSource;
  keyData: BufferSource;
  algorithm: HmacImportParams;
}): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", keyData, algorithm, false, [
    "sign",
  ]);
  return crypto.subtle.sign(key.algorithm.name, key, data);
}

async function cryptoVerify({
  data,
  keyData,
  signature,
  algorithm,
}: {
  data: BufferSource;
  keyData: BufferSource;
  signature: BufferSource;
  algorithm: HmacImportParams;
}): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", keyData, algorithm, false, [
    "verify",
  ]);
  return crypto.subtle.verify(key.algorithm.name, key, signature, data);
}
