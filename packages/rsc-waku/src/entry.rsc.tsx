import * as ReactServer from '@hiogawa/vite-rsc/rsc';
import wakuServerEntry from '../src/server-entry';

export type RscElementsPayload = Record<string, unknown>;
export type RscHtmlPayload = React.ReactNode;

type HandleRequestInput = Parameters<
  (typeof wakuServerEntry)['handleRequest']
>[0];

type HandleRequestImplementation = Parameters<
  (typeof wakuServerEntry)['handleRequest']
>[1];

type HandleReq = {
  body: ReadableStream | null;
  url: URL;
  method: string;
  headers: Readonly<Record<string, string>>;
};

// cf. packages/waku/src/lib/middleware/handler.ts `handler`
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const req: HandleReq = {
    body: request.body,
    url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  };

  // cf. packages/waku/src/lib/middleware/handler.ts `getInput`
  const rscPathPrefix =
    import.meta.env.WAKU_CONFIG_BASE_PATH +
    import.meta.env.WAKU_CONFIG_RSC_BASE +
    '/';
  let rscPath: string | undefined;
  let temporaryReferences: unknown | undefined;
  let wakuInput: HandleRequestInput;
  if (url.pathname.startsWith(rscPathPrefix)) {
    rscPath = decodeRscPath(
      decodeURI(url.pathname.slice(rscPathPrefix.length)),
    );
    // server action: js
    const actionId = decodeFuncId(rscPath);
    if (actionId) {
      const contentType = request.headers.get('content-type');
      const body = contentType?.startsWith('multipart/form-data')
        ? await request.formData()
        : await request.text();
      temporaryReferences = ReactServer.createTemporaryReferenceSet();
      const args = await ReactServer.decodeReply(body, { temporaryReferences });
      const action = await ReactServer.loadServerAction(actionId);
      wakuInput = {
        type: 'function',
        fn: action as any,
        args,
        req,
      };
    } else {
      // client RSC request
      wakuInput = {
        type: 'component',
        rscPath,
        rscParams: url.searchParams,
        req,
      };
    }
  } else if (request.method === 'POST') {
    // server action: no js (progressive enhancement)
    const formData = await request.formData();
    const decodedAction = await ReactServer.decodeAction(formData);
    wakuInput = {
      type: 'action',
      fn: async () => {
        const result = await decodedAction();
        return await ReactServer.decodeFormState(result, formData);
      },
      pathname: url.pathname,
      req,
    };
  } else {
    // SSR
    wakuInput = {
      type: 'custom',
      pathname: url.pathname,
      req,
    };
  }

  const implementation: HandleRequestImplementation = {
    // TODO: what `options` for?
    async renderRsc(elements, _options) {
      return ReactServer.renderToReadableStream<RscElementsPayload>(elements, {
        temporaryReferences,
      });
    },
    async renderHtml(
      elements,
      html,
      options?: { rscPath?: string; actionResult?: any },
    ) {
      const ssrEntryModule = await import.meta.viteRsc.loadModule<
        typeof import('./entry.ssr.tsx')
      >('ssr', 'index');

      const rscElementsStream =
        ReactServer.renderToReadableStream<RscElementsPayload>(elements);

      const rscHtmlStream =
        ReactServer.renderToReadableStream<RscHtmlPayload>(html);

      const htmlStream = await ssrEntryModule.renderHTML(
        rscElementsStream,
        rscHtmlStream,
        {
          debugNojs: url.searchParams.has('__nojs'),
          formState: options?.actionResult,
          rscPath: options?.rscPath,
        },
      );
      return {
        body: htmlStream as any,
        headers: { 'content-type': 'text/html' },
      };
    },
  };

  const wakuResult = await wakuServerEntry.handleRequest(
    wakuInput,
    implementation,
  );

  let response: Response;
  if (wakuResult) {
    if (wakuResult instanceof ReadableStream) {
      response = new Response(wakuResult);
    } else if (wakuResult.body) {
      response = new Response(wakuResult.body, {
        headers: wakuResult.headers as any,
      });
    }
  }
  response ??= new Response('[no-render-result]', { status: 404 });
  return response;
}

// cf. packages/waku/src/lib/renderers/utils.ts
const decodeRscPath = (rscPath: string) => {
  if (!rscPath.endsWith('.txt')) {
    const err = new Error('Invalid encoded rscPath');
    (err as any).statusCode = 400;
    throw err;
  }
  rscPath = rscPath.slice(0, -'.txt'.length);
  if (rscPath.startsWith('_')) {
    rscPath = rscPath.slice(1);
  }
  if (rscPath.endsWith('_')) {
    rscPath = rscPath.slice(0, -1);
  }
  return rscPath;
};

const FUNC_PREFIX = 'F/';

const decodeFuncId = (encoded: string) => {
  if (!encoded.startsWith(FUNC_PREFIX)) {
    return null;
  }
  const index = encoded.lastIndexOf('/');
  const file = encoded.slice(FUNC_PREFIX.length, index);
  const name = encoded.slice(index + 1);
  if (file.startsWith('_')) {
    return file.slice(1) + '#' + name;
  }
  return file + '#' + name;
};
