const INIT_SCRIPT = `
self.__rsc_stream = new ReadableStream({
	start(controller) {
		self.__rsc_push = (c) => controller.enqueue(c);
		self.__rsc_close = () => controller.close();
	}
}).pipeThrough(new TextEncoderStream());
`;

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
      // inject head script
      if (chunk.includes("</head>")) {
        chunk = chunk.replace(
          "</head>",
          () => toScriptTag(INIT_SCRIPT) + `</head>`,
        );
      }
      // delay html end
      if (chunk.includes("</body></html>")) {
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
            write(chunk) {
              enqueue(toScriptTag(`__rsc_push(${JSON.stringify(chunk)})`));
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
