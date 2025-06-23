import { Counter } from "./counter";

export async function Root(props: { request: Request }) {
  const url = new URL(props.request.url);

  let globPosts = import.meta.glob("./posts/*.mdx", { eager: true });
  globPosts = Object.fromEntries(
    Object.entries(globPosts).map(([k, v]) => [
      k.slice("./posts/".length, -".mdx".length),
      v,
    ]),
  );

  async function RootContent() {
    if (url.pathname === "/") {
      return (
        <ul>
          {Object.entries(globPosts).map(([key, value]) => (
            <li key={key}>
              <a href={`/${key}`} style={{ textTransform: "capitalize" }}>
                {(value as any).title ?? key}
              </a>
            </li>
          ))}
        </ul>
      );
    }

    const module = globPosts[url.pathname.slice(1)];
    if (!!module) {
      const Component = (module as any).default;
      return <Component />;
    }

    // TODO: 404
    return <p>Not found</p>;
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RSC MDX SSG</title>
      </head>
      <body>
        <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1>
            <a href="/">RSC + MDX + SSG</a>
          </h1>
          <Counter />
        </header>
        <main>
          <RootContent />
        </main>
      </body>
    </html>
  );
}
