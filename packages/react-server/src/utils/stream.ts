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

function mapTransformStream<T, U>(f: (v: T) => U) {
  return new TransformStream<T, U>({
    transform(chunk, controller) {
      controller.enqueue(f(chunk));
    },
  });
}

export function jsonStringifyTransform() {
  return mapTransformStream<unknown, string>(JSON.stringify);
}

export function jsonParseTransform() {
  return mapTransformStream<string, unknown>(JSON.parse);
}

export function ndjsonStringifyTransform() {
  return mapTransformStream<unknown, string>((v) => JSON.stringify(v) + "\n");
}

export function ndjsonParseTransform() {
  const split = splitTransform("\n");
  const parse = mapTransformStream<string, unknown>(JSON.parse);
  split.readable.pipeTo(parse.writable);
  return { writable: split.writable, readable: parse.readable };
}
