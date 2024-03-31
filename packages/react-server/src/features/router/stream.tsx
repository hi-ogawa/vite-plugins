import { tinyassert } from "@hiogawa/utils";

const SEP = "\n";

export function encodeStreamMap(
  streams: Record<string, ReadableStream<string>>,
): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      controller.enqueue(JSON.stringify(Object.keys(streams)) + SEP);
      await Promise.all(
        Object.entries(streams).map(async ([_key, stream], i) => {
          await stream.pipeTo(
            new WritableStream({
              write(chunk) {
                controller.enqueue(JSON.stringify([i, chunk]) + SEP);
              },
              close() {
                controller.enqueue(JSON.stringify([i, true]) + SEP);
              },
            }),
          );
        }),
      );
      controller.close();
    },
  });
}

export async function decodeStreamMap(encoded: ReadableStream<string>) {
  encoded = encoded.pipeThrough(splitTransform(SEP));

  const reader = encoded.getReader();
  const first = await reader.read();
  tinyassert(!first.done);
  const keys: string[] = JSON.parse(first.value);

  const controllers: ReadableStreamDefaultController<string>[] = [];
  const streams = Object.fromEntries(
    keys.map((key, i) => [
      key,
      new ReadableStream<string>({
        start(controller) {
          controllers[i] = controller;
        },
      }),
    ]),
  );

  const done = (async () => {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        return;
      }
      const [i, chunk] = JSON.parse(result.value) as [number, string | boolean];
      console.log({ i, chunk });
      const controller = controllers[i];
      tinyassert(controller);
      if (typeof chunk === "string") {
        controller.enqueue(chunk);
      } else {
        controller.close();
      }
    }
  })();

  return { streams, done };
}

function splitTransform(sep: string) {
  let acc = "";
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      acc += chunk;
      if (acc.includes(sep)) {
        const lines = acc.split(sep);
        acc = lines.pop()!;
        for (const line of lines) {
          controller.enqueue(line);
        }
      }
    },
  });
}
