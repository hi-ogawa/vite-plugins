// both server and client code here but all exports should be tree-shakable

const INIT_SCRIPT = `
self.__rsc_stream = new ReadableStream({
  start(controller) {
    self.__rsc_push = (chunk) => controller.enqueue(chunk);
    self.__rsc_close = () => controller.close();
  }
}).pipeThrough(new TextEncoderStream());
`.replace(/\s+/g, " ");

export function injectRscScript(
  stream: ReadableStream<Uint8Array>,
  options?: { nonce?: string },
): TransformStream<Uint8Array, Uint8Array> {
  return combineTransform(
    new TextDecoderStream(),
    combineTransform(
      createBufferedTransformStream(),
      combineTransform(
        injectRscScriptString(stream, options),
        new TextEncoderStream(),
      ),
    ),
  );
}

// TODO: handle binary (non utf-8) payload
// https://github.com/devongovett/rsc-html-stream

export function injectRscScriptString(
  stream: ReadableStream<Uint8Array>,
  options?: { nonce?: string },
): TransformStream<string, string> {
  let rscPromise: Promise<void> | undefined;
  const toScriptTag = (code: string) =>
    `<script ${options?.nonce ? `nonce="${options?.nonce}"` : ""}>${code}</script>`;
  return new TransformStream<string, string>({
    async transform(chunk, controller) {
      // delay html end
      if (chunk.endsWith("</body></html>")) {
        chunk = chunk.slice(0, -"</body></html>".length);
      }
      // start injecting rsc after body start
      if (chunk.includes("</head><body")) {
        controller.enqueue(chunk);
        if (rscPromise) {
          throw new Error("Invalid html chunk", { cause: chunk });
        }
        let enqueue = (chunk: string) => {
          try {
            controller.enqueue(chunk);
          } catch (e) {}
        };
        rscPromise = stream.pipeThrough(new TextDecoderStream()).pipeTo(
          new WritableStream({
            start() {
              enqueue(toScriptTag(INIT_SCRIPT));
            },
            write(chunk) {
              enqueue(
                toScriptTag(
                  `self.__rsc_push(${escapeHtml(JSON.stringify(chunk))})`,
                ),
              );
            },
            close() {
              enqueue(toScriptTag(`__rsc_close()`));
            },
          }),
        );
      } else {
        controller.enqueue(chunk);
      }
    },
    async flush(controller) {
      await rscPromise;
      controller.enqueue("</body></html>");
    },
  });
}

// Ensure html tag is not split into multiple chunks, which is necessary for `injectRscScript`.
// see https://github.com/hi-ogawa/vite-plugins/pull/457
export function createBufferedTransformStream(): TransformStream<
  string,
  string
> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let buffer = "";
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      if (typeof timeout !== "undefined") {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        try {
          controller.enqueue(buffer);
        } catch (e) {}
        buffer = "";
        timeout = undefined;
      }, 0);
    },
    async flush(controller) {
      if (typeof timeout !== "undefined") {
        clearTimeout(timeout);
        controller.enqueue(buffer);
      }
    },
  });
}

export function getRscScript(): ReadableStream<Uint8Array> {
  return (self as any).__rsc_stream;
}

function combineTransform<T1, T2, T3>(
  t1: TransformStream<T1, T2>,
  t2: TransformStream<T2, T3>,
): TransformStream<T1, T3> {
  return { writable: t1.writable, readable: t1.readable.pipeThrough(t2) };
}

// copied from
// https://github.com/remix-run/react-router/blob/1fb0df7f3cc2f89be99af434a224a98d29b1274d/packages/react-router/lib/dom/ssr/markup.ts#L27-L28

const ESCAPE_LOOKUP: { [match: string]: string } = {
  "&": "\\u0026",
  ">": "\\u003e",
  "<": "\\u003c",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

function escapeHtml(html: string) {
  return html.replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]!);
}
