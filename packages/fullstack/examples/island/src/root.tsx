import "./root.css";
import type { ComponentChildren } from "preact";

export default function Root(props: {
  head: ComponentChildren;
  children: ComponentChildren;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Island Framework</title>
        {props.head}
      </head>
      <body>
        <nav>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </nav>
        {props.children}
      </body>
    </html>
  );
}
