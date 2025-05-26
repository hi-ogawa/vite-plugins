import * as assetsManifest from "virtual:vite-rsc/assets-manifest";
import * as serverReferences from "virtual:vite-rsc/server-references";
import { setClientReferenceManifest, setRequireModule } from "./core/rsc";
import type { AssetsManifest } from "./plugin";
import { createFromReadableStream, renderToReadableStream } from "./rsc";
import { withBase } from "./utils/base";
import {
  arrayToStream,
  concatArrayStream,
  decryptBuffer,
  encryptBuffer,
  fromBase64,
} from "./utils/encryption-utils";

export {
  createClientManifest,
  createServerManifest,
  loadServerAction,
} from "./core/rsc";

export * from "./react/rsc";

export function initialize(): void {
  setClientReferenceManifest(getAssetsManifest().clientReferenceManifest);
  setRequireModule({
    load: async (id) => {
      if (import.meta.env.DEV) {
        return import(/* @vite-ignore */ id);
      } else {
        const import_ = serverReferences.default[id];
        if (!import_) {
          throw new Error(`server reference not found '${id}'`);
        }
        return import_();
      }
    },
  });
}

export async function importSsr<T>(): Promise<T> {
  const mod = await import("virtual:vite-rsc/import-ssr" as any);
  if (import.meta.env.DEV) {
    return mod.default();
  } else {
    return mod;
  }
}

export function getAssetsManifest(): AssetsManifest {
  return (assetsManifest as any).default;
}

export async function Resources({
  nonce,
}: { nonce?: string }): Promise<React.ReactNode> {
  let { css, js } = getAssetsManifest().entry.deps;
  if (import.meta.env.DEV) {
    const rscCss = await import("virtual:vite-rsc/rsc-css" as string);
    css = [...css, ...rscCss.default];
  }
  const cssLinks = css.map((href) => (
    <link
      key={href}
      rel="stylesheet"
      href={withBase(href)}
      precedence="high"
      nonce={nonce}
    />
  ));
  const jsLinks = js.map((href) => (
    <link key={href} rel="modulepreload" href={withBase(href)} nonce={nonce} />
  ));
  // https://vite.dev/guide/features.html#content-security-policy-csp
  // this isn't needed if `style-src: 'unsafe-inline'` (dev) and `script-src: 'self'`
  const viteCspNonce = nonce && <meta property="csp-nonce" nonce={nonce} />;
  return (
    <>
      {cssLinks}
      {jsLinks}
      {viteCspNonce}
    </>
  );
}

// based on
// https://github.com/parcel-bundler/parcel/blob/9855f558a69edde843b1464f39a6010f6b421efe/packages/transformers/js/src/rsc-utils.js
// https://github.com/vercel/next.js/blob/c10c10daf9e95346c31c24dc49d6b7cda48b5bc8/packages/next/src/server/app-render/encryption.ts
// https://github.com/vercel/next.js/pull/56377

export async function encryptActionBoundArgs(
  originalValue: unknown,
): Promise<string> {
  const serialized = renderToReadableStream(originalValue);
  const serializedBuffer = await concatArrayStream(serialized);
  return encryptBuffer(serializedBuffer, await getEncryptionKey());
}

export async function decryptActionBoundArgs(
  encrypted: ReturnType<typeof encryptActionBoundArgs>,
): Promise<unknown> {
  const serializedBuffer = await decryptBuffer(
    await encrypted,
    await getEncryptionKey(),
  );
  const serialized = arrayToStream(new Uint8Array(serializedBuffer));
  return createFromReadableStream(serialized);
}

// configurable via `define.__VITE_RSC_ENCRYPTION_KEY__`
declare let __VITE_RSC_ENCRYPTION_KEY__: string;
let keyPromise_: Promise<CryptoKey> | undefined;

function getEncryptionKey() {
  return (keyPromise_ ||= crypto.subtle.importKey(
    "raw",
    fromBase64(__VITE_RSC_ENCRYPTION_KEY__),
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"],
  ));
}
