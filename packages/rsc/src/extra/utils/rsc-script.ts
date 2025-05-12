// both server and client code here but all exports should be tree-shakable

export function injectRscScript(
  stream: ReadableStream<Uint8Array>,
  options?: { nonce?: string },
): TransformStream<Uint8Array, Uint8Array> {
  return combineTransform(
    createBufferedTransformStream(),
    injectRscScriptInner(stream, options),
  );
}
const BODY_HTML_END = new TextEncoder().encode("</body></html>");

function stripBodyHtmlEnd(chunk: Uint8Array) {
  // check `chunk.endsWith(BODY_HTML_END)` in Uint8Array
  if (
    BODY_HTML_END.every(
      (byte, i) => chunk[chunk.length - BODY_HTML_END.length + i] === byte,
    )
  ) {
    return chunk.slice(0, -BODY_HTML_END.length);
  }
  return chunk;
}

function injectRscScriptInner(
  stream: ReadableStream<Uint8Array>,
  options?: { nonce?: string },
): TransformStream<Uint8Array, Uint8Array> {
  let rscPromise: Promise<void> | undefined;
  return new TransformStream({
    async transform(htmlChunk, controller) {
      // strip </body></html> and keep original html otherwise
      controller.enqueue(stripBodyHtmlEnd(htmlChunk));

      // start injecting rsc
      if (!rscPromise) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const enqueueScript = (content: string) => {
          try {
            controller.enqueue(
              encoder.encode(
                `<script ${options?.nonce ? `nonce="${options?.nonce}"` : ""}>${content}</script>`,
              ),
            );
          } catch (e) {
            // silence enqueue error e.g. when response stream is aborted
            // console.error("[enqueueScript]", e)
          }
        };
        rscPromise = stream.pipeTo(
          new WritableStream({
            start() {
              enqueueScript(
                `
                self.__rsc_stream = new ReadableStream({
                  start(controller) {
                    const encoder = new TextEncoder();
                    self.__rsc_push = (chunk) => controller.enqueue(encoder.encode(chunk));
                    self.__rsc_push_bin = (chunk) => controller.enqueue(chunk);
                    self.__rsc_close = () => controller.close();
                  }
                });
                `.replace(/\s+/g, " "),
              );
            },
            write(chunk) {
              // handle binary data simliar to https://github.com/devongovett/rsc-html-stream
              try {
                const content = escapeHtml(
                  JSON.stringify(decoder.decode(chunk, { stream: true })),
                );
                enqueueScript(`self.__rsc_push(${content})`);
              } catch {
                // https://developer.mozilla.org/en-US/docs/Web/API/Window/btoa#unicode_strings
                const base64 = btoa(
                  Array.from(chunk, (byte) => String.fromCodePoint(byte)).join(
                    "",
                  ),
                );
                const content = `Uint8Array.from(atob("${base64}"), (m) => m.codePointAt(0))`;
                enqueueScript(`self.__rsc_push_bin(${content})`);
              }
            },
            close() {
              enqueueScript(`__rsc_close()`);
            },
          }),
        );
      }
    },
    async flush(controller) {
      await rscPromise;
      controller.enqueue(BODY_HTML_END);
    },
  });
}

// Ensure html tag is not split into multiple chunks by buffering macro tasks.
// see https://github.com/hi-ogawa/vite-plugins/pull/457
function createBufferedTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let bufferedChunks: Uint8Array[] = [];
  return new TransformStream({
    transform(chunk, controller) {
      bufferedChunks.push(chunk);
      if (typeof timeout !== "undefined") {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        try {
          controller.enqueue(concatArrays(bufferedChunks));
        } catch (e) {
          // silence enqueue error e.g. when response stream is aborted
          // console.error("[createBufferedTransformStream]", e)
        }
        bufferedChunks = [];
        timeout = undefined;
      }, 0);
    },
    async flush(controller) {
      if (typeof timeout !== "undefined") {
        clearTimeout(timeout);
        controller.enqueue(concatArrays(bufferedChunks));
      }
    },
  });
}

function concatArrays(arrays: Uint8Array[]) {
  let total = 0;
  for (const chunk of arrays) {
    total += chunk.length;
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of arrays) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
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
