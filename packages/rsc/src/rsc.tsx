import * as assetsManifest from "virtual:vite-rsc/assets-manifest";
import * as serverReferences from "virtual:vite-rsc/server-references";
import { setRequireModule } from "./core/rsc";
import type { AssetsManifest } from "./plugin";
import { withBase } from "./utils/base";

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
