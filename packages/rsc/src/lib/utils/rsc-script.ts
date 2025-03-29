const INIT_SCRIPT = `
self.__raw_import = (id) => import(id);
self.__rsc_stream = new ReadableStream({
	start(controller) {
		self.__rsc_push = (c) => controller.enqueue(c);
		self.__rsc_close = () => controller.close();
	}
}).pipeThrough(new TextEncoderStream());
`;

export function injectRscScript(
  stream: ReadableStream<Uint8Array>,
): TransformStream<string, string> {
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
                `<script>__rsc_push(${JSON.stringify(chunk)})</script>`,
              );
            },
            close() {
              controller.enqueue(`<script>__rsc_close()</script>`);
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

// it seems buffering is necessary to ensure tag marker (e.g. `</body>`) is not split into multiple chunks.
// Without this, above `injectFlightStream` breaks when receiving two chunks separately for "...<" and "/body>...".
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

export function getRscScript(): ReadableStream<Uint8Array> {
  return (self as any).__rsc_stream;
}
