import bootstrapScriptContent from 'virtual:vite-rsc/bootstrap-script-content';
import { injectRscStreamToHtml } from '@hiogawa/vite-rsc/rsc-html-stream/ssr';
import * as ReactClient from '@hiogawa/vite-rsc/ssr';
import React from 'react';
import type { ReactFormState } from 'react-dom/client';
import * as ReactDOMServer from 'react-dom/server.edge';
import type { RscHtmlPayload, RscElementsPayload } from './entry.rsc';
import { INTERNAL_ServerRoot } from 'waku/minimal/client';

export async function renderHTML(
  rscStream: ReadableStream<Uint8Array>,
  rscHtmlStream: ReadableStream<Uint8Array>,
  options?: {
    rscPath?: string;
    formState?: ReactFormState;
    nonce?: string;
    debugNojs?: boolean;
  },
) {
  // cf. packages/waku/src/lib/renderers/html.ts `renderHtml`

  const [stream1, stream2] = rscStream.tee();

  let elementsPromise: Promise<RscElementsPayload>;
  let htmlPromise: Promise<RscHtmlPayload>;

  // deserialize RSC stream back to React VDOM
  function SsrRoot() {
    elementsPromise ??=
      ReactClient.createFromReadableStream<RscElementsPayload>(stream1);
    htmlPromise ??=
      ReactClient.createFromReadableStream<RscHtmlPayload>(rscHtmlStream);
    return (
      <INTERNAL_ServerRoot elementsPromise={elementsPromise}>
        {React.use(htmlPromise)}
      </INTERNAL_ServerRoot>
    );
  }

  // render html (traditional SSR)
  const htmlStream = await ReactDOMServer.renderToReadableStream(<SsrRoot />, {
    bootstrapScriptContent: options?.debugNojs
      ? undefined
      : getBootstrapPreamble({ rscPathForFakeFetch: options?.rscPath || '' }) +
        bootstrapScriptContent,
    nonce: options?.nonce,
    // no types
    ...{ formState: options?.formState },
  });

  let responseStream: ReadableStream = htmlStream;
  if (!options?.debugNojs) {
    responseStream = responseStream.pipeThrough(
      injectRscStreamToHtml(stream2, {
        nonce: options?.nonce,
      }),
    );
  }

  return responseStream;
}

// cf. packages/waku/src/lib/renderers/html.ts `parseHtmlHead`
function getBootstrapPreamble(options: { rscPathForFakeFetch: string }) {
  return `
    globalThis.__WAKU_HYDRATE__ = true;
    globalThis.__WAKU_PREFETCHED__ = {
      ${JSON.stringify(options.rscPathForFakeFetch)}: ${FAKE_FETCH_CODE}
    };
  `;
}

const FAKE_FETCH_CODE = `
Promise.resolve(new Response(new ReadableStream({
  start(c) {
    const d = (self.__FLIGHT_DATA ||= []);
    const t = new TextEncoder();
    const f = (s) => c.enqueue(typeof s === 'string' ? t.encode(s) : s);
    d.forEach(f);
    d.push = f;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => c.close());
    } else {
      c.close();
    }
  }
})))
`;
