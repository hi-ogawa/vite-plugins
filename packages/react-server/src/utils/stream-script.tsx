// cf.
// https://github.com/vercel/next.js/blob/b2eafbf6b3550b1f0d643c326515814610747532/packages/next/src/server/stream-utils/node-web-streams-helper.ts#L382-L387
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/server/app-render/use-flight-response.tsx#L19-L26
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/client/app-index.tsx#L110-L113
// https://github.com/devongovett/rsc-html-stream/

export function injectStreamScript(stream: ReadableStream<string>) {
  const search = "</body>";
  let i = 0;
  return new TransformStream<string, string>({
    async transform(chunk, controller) {
      console.log("[injectStreamScript]", { i: i++, chunk });
      if (!chunk.includes(search)) {
        controller.enqueue(chunk);
        return;
      }

      const [pre, post] = chunk.split(search);
      controller.enqueue(pre);

      // TODO: handle cancel?
      await stream.pipeTo(
        new WritableStream({
          start() {
            controller.enqueue(`<script>self.__stream_chunks||=[]</script>`);
          },
          write(chunk) {
            // assume chunk is already encoded as javascript code e.g. by
            //   stream.pipeThrough(jsonStringifyTransform())
            controller.enqueue(
              `<script>__stream_chunks.push(${chunk})</script>`,
            );
          },
        }),
      );

      controller.enqueue(search + post);
    },
  });
}

export function readStreamScript<T>() {
  return new ReadableStream<T>({
    start(controller) {
      const chunks: T[] = ((globalThis as any).__stream_chunks ||= []);

      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }

      chunks.push = function (chunk) {
        controller.enqueue(chunk);
        return 0;
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          controller.close();
        });
      } else {
        controller.close();
      }
    },
  });
}

// it seems buffering is necessary to ensure tag marker (e.g. `</body>`) is not split into multiple chunks.
// Without this, above `injectStreamScript` breaks when receiving two chunks for "...<" and "/body>...".
// see https://github.com/hi-ogawa/vite-plugins/pull/457
export function bufferedTransformStream() {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let buffer = "";
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      if (typeof timeout !== "undefined") {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        controller.enqueue(buffer);
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
