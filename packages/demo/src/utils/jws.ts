//
// quick-and-dirty jws
//
// cf.
// https://github.com/remix-run/remix/blob/100ecd3ea686eeec14f17fa908116b74aebdb91c/packages/remix-cloudflare/crypto.ts#L14-L21
// https://github.com/auth0/node-jws/blob/b9fb8d30e9c009ade6379f308590f1b0703eefc3/lib/sign-stream.js
// https://github.com/panva/jose/blob/e2836e6aaaddecde053018884abb040908f186fd/src/runtime/browser/sign.ts
//

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
  const headerString = encodeJson(JWS_HEADER);
  const payloadString = encodeJson(payload);
  const dataString = `${headerString}.${payloadString}`;
  const signatureBin = await cryptoSign({
    data: encodeUtf8(dataString),
    keyData: encodeUtf8(secret),
    algorithm: CRYPTO_ALGORITHM,
  });
  const signatureString = encodeBase64url(new Uint8Array(signatureBin));
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

  const dataString = `${headerString}.${payloadString}`;
  const isValid = await cryptoVerify({
    data: encodeUtf8(dataString),
    keyData: encodeUtf8(secret),
    signature: decodeBase64url(signatureString),
    algorithm: CRYPTO_ALGORITHM,
  });
  tinyassert(isValid, "invalid signature");

  return decodeJson(payloadString);
}

function encodeJson(payload: unknown) {
  return encodeBase64url(encodeUtf8(JSON.stringify(payload)));
}

function decodeJson(payloadString: string): unknown {
  return JSON.parse(decodeUtf8(decodeBase64url(payloadString)));
}

//
// string <-> buffer
//

const encodeUtf8 = (v: string) => new TextEncoder().encode(v);
const decodeUtf8 = (v: BufferSource) => new TextDecoder().decode(v);

//
// base64url string <-> buffer (cf. https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem)
//

function encodeBase64url(buffer: Uint8Array): string {
  const binString = Array.from(buffer, (c) => String.fromCharCode(c)).join("");
  const base64 = btoa(binString);
  const base64url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return base64url;
}

function decodeBase64url(base64url: string): Uint8Array {
  // atob can handle without padding
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const binString = atob(base64);
  const buffer = Uint8Array.from(binString, (c) => c.charCodeAt(0)!);
  return buffer;
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
