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
): TransformStream<string, string> {
  return new TransformStream<string, string>({
    async transform(chunk, controller) {
      // TODO: chunk is not guaranteed to include entire end tag `</...>`
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

export function getRscScript(): ReadableStream<Uint8Array> {
  return (self as any).__f_stream;
}
