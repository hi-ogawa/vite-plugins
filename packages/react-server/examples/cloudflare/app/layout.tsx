import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <body>{props.children}</body>
    </html>
  );
}
