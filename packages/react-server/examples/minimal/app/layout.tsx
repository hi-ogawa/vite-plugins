import Link from "next/link";
import type React from "react";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <body>
        <h3>[Layout]</h3>
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/test">Test</Link>
          </li>
        </ul>
        {props.children}
      </body>
    </html>
  );
}
