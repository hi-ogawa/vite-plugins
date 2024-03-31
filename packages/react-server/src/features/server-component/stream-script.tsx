// cf.
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/server/app-render/use-flight-response.tsx#L19-L26
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/client/app-index.tsx#L110-L113
// https://github.com/devongovett/rsc-html-stream/

// TODO: handle cancel?
// TODO: handle binary?

export function injectStreamScript(stream: ReadableStream<string>) {
  const search = "</body>";
  return new TransformStream<string, string>({
    async transform(chunk, controller) {
      if (!chunk.includes(search)) {
        controller.enqueue(chunk);
        return;
      }

      const [pre, post] = chunk.split(search);
      controller.enqueue(pre);

      await stream.pipeTo(
        new WritableStream({
          start() {
            controller.enqueue(`<script>self.__stream_chunks||=[]</script>`);
          },
          write(chunk) {
            // assume chunk is already encoded as raw js string e.g. by
            //   stream.pipeThrough(jsonStringifyTransform())
            controller.enqueue(
              `<script>__stream_chunks.push(${chunk})</script>`,
            );
          },
          close() {
            controller.enqueue(
              `<script>__stream_chunks.push("__stream_close")</script>`,
            );
          },
        }),
      );

      controller.enqueue(search + post);
    },
  });
}

export function readStreamScript() {
  const stream = new ReadableStream<unknown>({
    start(controller) {
      function handleChunk(chunk: string) {
        if (chunk === "__stream_close") {
          controller.close();
          return;
        }
        controller.enqueue(chunk);
      }

      const chunks: string[] = ((globalThis as any).__stream_chunks ||= []);
      for (const chunk of chunks) {
        handleChunk(chunk);
      }

      chunks.push = function (chunk) {
        handleChunk(chunk);
        return 0;
      };
    },
  });
  return stream;
}
