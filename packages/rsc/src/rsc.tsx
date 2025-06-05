import * as assetsManifest from "virtual:vite-rsc/assets-manifest";
import * as serverReferences from "virtual:vite-rsc/server-references";
import { setRequireModule } from "./core/rsc";
import type { AssetsManifest } from "./plugin";
import { createFromReadableStream, renderToReadableStream } from "./react/rsc";
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
