import "./root.css";
import type { Remix } from "@remix-run/dom";

export default function Root(props: {
  head: Remix.RemixNode;
  children: Remix.RemixNode;
  pathname: string;
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
              <a
                href="/"
                className={props.pathname === "/" ? "active" : undefined}
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/about"
                className={props.pathname === "/about" ? "active" : undefined}
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/books"
                className={props.pathname === "/books" ? "active" : undefined}
              >
                Books
              </a>
            </li>
          </ul>
        </nav>
        {props.children}
      </body>
    </html>
  );
}
