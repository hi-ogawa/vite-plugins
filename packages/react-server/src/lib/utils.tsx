/**
 * @example
 * "/hello/world" =>
 *    [
 *      ["",             ""],
 *      ["/hello",       "hello"],
 *      ["/hello/world", "world"],
 *    ]
 */
export function getPathPrefixes(pathname: string) {
  const keys = normalizePathname(pathname).split("/");
  return keys.map((key, i) => [keys.slice(0, i + 1).join("/"), key] as const);
}

// strip trailing slash (including "/" => "")
export function normalizePathname(pathname: string) {
  return pathname.replaceAll(/\/*$/g, "");
}

export function mergeStream(
  s1: ReadableStream<Uint8Array>,
  s2: ReadableStream<Uint8Array>,
) {
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const v of s1 as any) {
        if (cancelled) {
          s1.cancel();
          s2.cancel();
          return;
        }
        controller.enqueue(v);
      }
      // magic separate?
      controller.enqueue(new Uint8Array([0, 0]));
      for await (const v of s2 as any) {
        if (cancelled) {
          s2.cancel();
          return;
        }
        controller.enqueue(v);
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}

export function splitStream(
  s1: ReadableStream<Uint8Array>,
  s2: ReadableStream<Uint8Array>,
) {
  let cancelled = false;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const v of s1 as any) {
        if (cancelled) {
          s1.cancel();
          s2.cancel();
          return;
        }
        controller.enqueue(v);
      }
      for await (const v of s2 as any) {
        if (cancelled) {
          s2.cancel();
          return;
        }
        controller.enqueue(v);
      }
    },
    cancel() {
      cancelled = true;
    },
  });
}

export function serializeStreamArray(
  parts: ReadableStream<Uint8Array>[],
): ReadableStream<Uint8Array> {
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller;
      cancelled;
      // controller.enqueue("!__length__:" + parts.length + "\n\n");

      for (const part of parts) {
        part;
      }

      // send promise as it resolves
      // promises.forEach((promise, i) => {
      //   promise.then(
      //     (data) => {
      //       if (cancelled) return;
      //       // TODO: recursively encode data
      //       controller.enqueue(
      //         JSON.stringify({ type: "resolve", i, data }) + "\n"
      //       );
      //     },
      //     (data) => {
      //       if (cancelled) return;
      //       controller.enqueue(
      //         JSON.stringify({ type: "reject", i, data }) + "\n"
      //       );
      //     }
      //   );
      // });

      // Promise.allSettled(promises).then(() => {
      //   controller.close();
      // });
    },
    cancel() {
      cancelled = true;
    },
  });
  return stream;

  // Object.entries(parts);
  // // parts;
  // throw "todo";
}

export function deserializeStreamArray(
  combined: ReadableStream<Uint8Array>,
): Record<string, ReadableStream<Uint8Array>> {
  combined;
  // proxy?
  // combined;
  throw "todo";
}

export function serializeStreamRecord(
  mapping: Record<string, ReadableStream<Uint8Array>>,
  stream: ReadableStream<Uint8Array>,
) {
  mapping;
  // createFromReadableStream;
  stream;
  throw "todo";
}

export function deserializeStreamRecord(
  mapping: Record<string, ManualPromise<ReadableStream<Uint8Array>>>,
  stream: ReadableStream<Uint8Array>,
) {
  mapping;
  // createFromReadableStream;
  stream;
  // toStream;
  throw "todo";
}

// copied from
// https://github.com/hi-ogawa/js-utils/blob/c53fc896ccc62e16718bf3013b821ce26152e581/packages/utils/src/promise.ts#L11
export interface ManualPromise<T> extends PromiseLike<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (value: unknown) => void;
}

export function createManualPromise<T>(): ManualPromise<T> {
  let resolve!: ManualPromise<T>["resolve"];
  let reject!: ManualPromise<T>["reject"];
  const promise = new Promise<T>((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return { promise, resolve, reject, then: promise.then.bind(promise) };
}
