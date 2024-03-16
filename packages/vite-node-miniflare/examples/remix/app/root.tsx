import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body
        ref={(el) => {
          // for e2e
          el?.classList.add("hydrated");
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link to="/">Index</Link>
          <Link to="/demo">Loader/Action Demo</Link>
          <Link to="/style">Style Demo</Link>
          <Link to="/demo-kv">KV Demo</Link>
          <input placeholder="debug state" />
        </div>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
