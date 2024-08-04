"use client";

export default function GlobalError(props: { reset: () => void }) {
  return (
    <html>
      <body>
        <h1>Something went wrong!</h1>
        <button onClick={() => props.reset()}>Try again</button>
      </body>
    </html>
  );
}
