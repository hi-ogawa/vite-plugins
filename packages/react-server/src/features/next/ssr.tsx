// inject default meta viewport
export function injectDefaultMetaViewport() {
  const HEAD_END = "</head>";
  const META_VIEWPORT_PATTERN = `<meta name="viewport"`;
  const META_VIEWPORT_DEFAULT = `<meta name="viewport" content="width=device-width, initial-scale=1">`;

  let done = false;
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      if (done) {
        controller.enqueue(chunk);
        return;
      }
      if (chunk.includes(META_VIEWPORT_PATTERN)) {
        done = true;
      } else if (chunk.includes(HEAD_END)) {
        chunk.replace(HEAD_END, () => `${META_VIEWPORT_DEFAULT}${HEAD_END}`);
        done = true;
      }
      controller.enqueue(chunk);
    },
  });
}
