export type PPRData = {
  preludeString: string;
  postponed: any;
};

export type PPRManifest = {
  entries: Record<string, PPRData>;
};

export async function streamToString(stream: ReadableStream<Uint8Array>) {
  let s = "";
  await stream.pipeThrough(new TextDecoderStream()).pipeTo(
    new WritableStream({
      write(c) {
        s += c;
      },
    }),
  );
  return s;
}
