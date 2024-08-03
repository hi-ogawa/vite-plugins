import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <title>custom-out-dir</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
