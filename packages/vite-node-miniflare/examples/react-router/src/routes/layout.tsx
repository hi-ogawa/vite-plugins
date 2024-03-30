import { Link, Outlet } from "react-router-dom";

export function Component() {
  return (
    <div>
      <header>
        <h4>
          SSR Demo
          <a
            style={{ fontSize: "0.8rem", marginLeft: "0.3rem" }}
            href="https://github.com/hi-ogawa/vite-plugins/tree/main/examples/ssr"
            target="_blank"
          >
            (source code)
          </a>
        </h4>
        <ul>
          <li>
            <Link to="/">Index</Link>
          </li>
          <li>
            <Link to="/loader-data">Loader Data</Link>
          </li>
          <li>
            <Link to="/redirect">Redirect to Index</Link>
          </li>
          <li>
            <a href="/redirect" target="_blank">
              Redirect to index (new tab)
            </a>
          </li>
          <li>
            <a href="/nodejs-compat">nodejs compat</a>
          </li>
          <li>
            <a href="/hello">GET API</a>
          </li>
          <li>
            <form method="post" action="/hello">
              <input name="input" defaultValue="test" />
              <button>POST API</button>
            </form>
          </li>
        </ul>
      </header>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
