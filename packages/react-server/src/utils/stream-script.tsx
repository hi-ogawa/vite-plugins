import React from "react";

// based on
// https://github.com/remix-run/react-router/blob/09b52e491e3927e30e707abe67abdd8e9b9de946/packages/react-router/lib/dom/ssr/single-fetch.tsx#L49

export function StreamTransfer(props: { stream: ReadableStream<Uint8Array> }) {
  const textStream = props.stream.pipeThrough(new TextDecoderStream());
  const reader = textStream.getReader();

  const results = new Array<Promise<ReadableStreamReadResult<string>>>();

  function Recurse(props: { depth: number }) {
    const result = React.use((results[props.depth] ??= reader.read()));
    if (result.done) {
      return renderScript(`self.__f_close()`);
    }
    // TODO: escape?
    return (
      <>
        {renderScript(`self.__f_push(${JSON.stringify(result.value)})`)}
        <React.Suspense>
          <Recurse depth={props.depth + 1} />
        </React.Suspense>
      </>
    );
  }

  return (
    <>
      {renderScript(`
self.__flightStream = new ReadableStream({
	start(ctrl) {
		self.__f_push = (c) => ctrl.enqueue(c);
		self.__f_close = () => ctrl.close();
	}
}).pipeThrough(new TextEncoderStream())
`)}
      <React.Suspense>
        <Recurse depth={0} />
      </React.Suspense>
    </>
  );
}

function renderScript(code: string) {
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
