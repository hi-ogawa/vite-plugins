import crypto from "node:crypto";
import { tinyassert } from "@hiogawa/utils";

//
// quick and dirty JWS based on crypto.subtle and atob/btoa
//
// cf.
// https://github.com/remix-run/remix/blob/100ecd3ea686eeec14f17fa908116b74aebdb91c/packages/remix-cloudflare/crypto.ts#L14-L21
// https://github.com/auth0/node-jws/blob/b9fb8d30e9c009ade6379f308590f1b0703eefc3/lib/sign-stream.js
// https://github.com/panva/jose/blob/e2836e6aaaddecde053018884abb040908f186fd/src/runtime/browser/sign.ts
//

// hard-code algorithm
const JWS_ALGORITHM = "HS256";
const CRYPTO_SUBTLE_ALGORITHM = { name: "HMAC", hash: "SHA-256" };

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function jwsSign({
  payload,
  secret,
}: {
  payload: unknown;
  secret: string;
}): Promise<string> {
  const header = { alg: JWS_ALGORITHM };
  const dataB64 = jsonToB64(header) + "." + jsonToB64(payload);
  const signature = await cryptoSign({
    data: textEncoder.encode(dataB64),
    secret: textEncoder.encode(secret),
  });
  const signatureB64 = toB64(new Uint8Array(signature));
  const token = dataB64 + "." + signatureB64;
  return token;
}

export async function jwsVerify({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): Promise<{ payload: unknown }> {
  // parse components
  const components = token.split(".");
  tinyassert(components.length === 3);
  const [headerB64, payloadB64, signatureB64] = components;
  tinyassert(headerB64 && payloadB64 && signatureB64);

  // parse header and payload
  const header = jsonFromB64(headerB64);
  const payload = jsonFromB64(payloadB64);
  tinyassert(header.ok && payload.ok);
  tinyassert(
    header.data &&
      typeof header.data === "object" &&
      "alg" in header.data &&
      header.data.alg === JWS_ALGORITHM
  );

  // verify signature
  const dataB64 = headerB64 + "." + payloadB64;
  const isValid = await cryptoVerify({
    data: textEncoder.encode(dataB64),
    secret: textEncoder.encode(secret),
    signature: fromB64(signatureB64),
  });
  tinyassert(isValid, "invalid signature");

  return { payload: payload.data };
}

//
// base64url
//
// cf. https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem
//

function toB64(bin: Uint8Array): string {
  const strBin = Array.from(bin, (c) => String.fromCharCode(c)).join("");
  const base64 = btoa(strBin);
  const base64url = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return base64url;
}

function fromB64(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const strBin = atob(base64);
  const bin = Uint8Array.from(strBin, (c) => c.codePointAt(0) ?? 0);
  return bin;
}

function jsonToB64(value: unknown): string {
  return toB64(textEncoder.encode(JSON.stringify(value)));
}

function jsonFromB64(encoded: string): { ok: boolean; data: unknown } {
  const jsonString = textDecoder.decode(fromB64(encoded));
  try {
    return { ok: true, data: JSON.parse(jsonString) };
  } catch (e) {
    return { ok: false, data: e };
  }
}

//
// crypto.subtle wrapper
//

async function cryptoSign({
  data,
  secret,
}: {
  data: BufferSource;
  secret: BufferSource;
}): Promise<ArrayBuffer> {
  const key = await cryptoImportKey({ secret, usage: "sign" });
  return await crypto.subtle.sign(key.algorithm.name, key, data);
}

async function cryptoVerify({
  data,
  signature,
  secret,
}: {
  data: BufferSource;
  signature: BufferSource;
  secret: BufferSource;
}): Promise<boolean> {
  const key = await cryptoImportKey({ secret, usage: "verify" });
  return await crypto.subtle.verify(key.algorithm.name, key, signature, data);
}

async function cryptoImportKey({
  secret,
  usage,
}: {
  secret: BufferSource;
  usage: "sign" | "verify";
}) {
  return crypto.subtle.importKey(
    "raw",
    secret,
    CRYPTO_SUBTLE_ALGORITHM,
    false,
    [usage]
  );
}
