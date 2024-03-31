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
