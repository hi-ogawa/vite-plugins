import { describe, expect, it } from "vitest";
import { decodeStreamMap, encodeStreamMap } from "./stream";

function fromChunks<T>(chunks: T[]) {
  return new ReadableStream<T>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

async function toChunks<T>(stream: ReadableStream<T>) {
  const chunks: T[] = [];
  await stream.pipeTo(
    new WritableStream({
      write(chunk) {
        chunks.push(chunk);
      },
    }),
  );
  return chunks;
}

describe(encodeStreamMap, () => {
  it("basic", async () => {
    const encoded = encodeStreamMap({
      foo: fromChunks(["hello", "world"]),
      bar: fromChunks(["server", "component", "rocks"]),
    });
    const [stream1, stream2] = encoded.tee();
    expect(await toChunks(stream1)).toMatchInlineSnapshot(`
      [
        [
          "foo",
          "bar",
        ],
        [
          0,
          "hello",
        ],
        [
          1,
          "server",
        ],
        [
          0,
          "world",
        ],
        [
          1,
          "component",
        ],
        [
          0,
          true,
        ],
        [
          1,
          "rocks",
        ],
        [
          1,
          true,
        ],
      ]
    `);
    const decoded = await decodeStreamMap(stream2);
    const result: any = {};
    for (const [key, stream] of Object.entries(decoded.streams)) {
      result[key] = await toChunks(stream);
    }
    await decoded.done;
    expect(result).toMatchInlineSnapshot(`
      {
        "bar": [
          "server",
          "component",
          "rocks",
        ],
        "foo": [
          "hello",
          "world",
        ],
      }
    `);
  });
});
