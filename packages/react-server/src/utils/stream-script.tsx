// cf.
// https://github.com/vercel/next.js/blob/b2eafbf6b3550b1f0d643c326515814610747532/packages/next/src/server/stream-utils/node-web-streams-helper.ts#L382-L387
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/server/app-render/use-flight-response.tsx#L19-L26
// https://github.com/vercel/next.js/blob/1c5aa7fa09cc5503c621c534fc40065cbd2aefcb/packages/next/src/client/app-index.tsx#L110-L113
// https://github.com/devongovett/rsc-html-stream/

const INIT_SCRIPT = `
self.__flightStream = new ReadableStream({
	start(controller) {
		self.__f_push = (c) => controller.enqueue(c);
		self.__f_close = () => controller.close();
	}
}).pipeThrough(new TextEncoderStream());
`;

export function injectFlightStream(stream: ReadableStream<Uint8Array>) {
  return new TransformStream<string, string>({
    async transform(chunk, controller) {
      if (chunk.includes("</head>")) {
        chunk = chunk.replace(
          "</head>",
          () => `<script>${INIT_SCRIPT}</script></head>`,
        );
      }
      if (chunk.includes("</body>")) {
        const i = chunk.indexOf("</body>");
        controller.enqueue(chunk.slice(0, i));
        await stream.pipeThrough(new TextDecoderStream()).pipeTo(
          new WritableStream({
            write(chunk) {
              controller.enqueue(
                `<script>__f_push(${JSON.stringify(chunk)})</script>`,
              );
            },
            close() {
              controller.enqueue(`<script>__f_close()</script>`);
            },
          }),
        );
        controller.enqueue(chunk.slice(i));
      } else {
        controller.enqueue(chunk);
      }
    },
  });
}

export function getFlightStreamBrowser(): ReadableStream<Uint8Array> {
  return (self as any).__flightStream;
}

// it seems buffering is necessary to ensure tag marker (e.g. `</body>`) is not split into multiple chunks.
// Without this, above `injectFlightStream` breaks when receiving two chunks separately for "...<" and "/body>...".
// see https://github.com/hi-ogawa/vite-plugins/pull/457
export function createBufferedTransformStream() {
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
