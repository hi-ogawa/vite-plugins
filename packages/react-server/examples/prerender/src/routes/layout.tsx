import "../style.css";
import { Link } from "@hiogawa/react-server/client";
import { Hydrated } from "./_client";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>React Server Prerender</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <h3>React Server Prerender</h3>
        <a
          href="https://github.com/hi-ogawa/vite-plugins/tree/main/packages/react-server"
          target="_blank"
        >
          GitHub
        </a>
        <Hydrated />
        <nav>
          <ul>
            <li>
              <Link href="/" preload>
                Home
              </Link>
            </li>
            <li>
              <Link href="/counter" preload>
                Counter
              </Link>
            </li>
            <li>
              <Link href="/posts" preload>
                Posts
              </Link>
            </li>
          </ul>
        </nav>
        {props.children}
      </body>
    </html>
  );
}
