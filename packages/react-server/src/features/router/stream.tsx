import { tinyassert } from "@hiogawa/utils";

export function teeStreamMap<T>(
  streams: Record<string, ReadableStream<T>>,
): [Record<string, ReadableStream<T>>, Record<string, ReadableStream<T>>] {
  const result1: any = {};
  const result2: any = {};
  for (const [k, v] of Object.entries(streams)) {
    [result1[k], result2[k]] = v.tee();
  }
  return [result1, result2];
}

export function encodeStreamMap(
  streams: Record<string, ReadableStream<string>>,
): ReadableStream<unknown> {
  return new ReadableStream<unknown>({
    async start(controller) {
      controller.enqueue(Object.keys(streams));
      await Promise.all(
        Object.entries(streams).map(async ([_key, stream], i) => {
          await stream.pipeTo(
            new WritableStream({
              write(chunk) {
                controller.enqueue([i, chunk]);
              },
              close() {
                controller.enqueue([i, true]);
              },
            }),
          );
        }),
      );
      controller.close();
    },
  });
}

export async function decodeStreamMap(encoded: ReadableStream<unknown>) {
  const reader = encoded.getReader();
  const first = await reader.read();
  tinyassert(!first.done);
  const keys = first.value as string[];

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
      const [i, chunk] = result.value as [number, string | boolean];
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

export function splitTransform(sep: string) {
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

export function jsonStringifyTransform() {
  return new TransformStream<unknown, string>({
    transform(chunk, controller) {
      controller.enqueue(JSON.stringify(chunk));
    },
  });
}

export function jsonParseTransform() {
  return new TransformStream<string, unknown>({
    transform(chunk, controller) {
      controller.enqueue(JSON.parse(chunk));
    },
  });
}
