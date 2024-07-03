import "../style.css";
import { Link } from "@hiogawa/react-server/client";

export default function Layout(props: React.PropsWithChildren) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>React Server Starter</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <h3>React Server Starter</h3>
        <a
          href="https://github.com/hi-ogawa/vite-plugins/tree/main/packages/react-server"
          target="_blank"
        >
          GitHub
        </a>
        <nav>
          <ul>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/use-state">Counter (useState)</Link>
            </li>
            <li>
              <Link href="/server-action">Counter (server action)</Link>
            </li>
          </ul>
        </nav>
        {props.children}
      </body>
    </html>
  );
}
