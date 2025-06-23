export async function Root(props: { request: Request }) {
  const url = new URL(props.request.url);

  let posts = import.meta.glob("./posts/*.mdx");
  posts = Object.fromEntries(
    Object.entries(posts).map(([k, v]) => [
      k.slice("./posts/".length, -".mdx".length),
      v,
    ]),
  );

  async function Router() {
    if (url.pathname === "/") {
      return <ul>
        {Object.keys(posts).map((key) => (
          <li key={key}>
            <a href={`/${key}`} style={{ textTransform: 'capitalize' }}>{key}</a>
          </li>
        ))}
      </ul>
    }

    const post = posts[url.pathname.slice(1)];
    if (!!post) {
      const mod: any = await post();
      return <mod.default />;
    }

    // TODO: 404
    return <p>Not found</p>
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RSC MDX SSG</title>
      </head>
      <body>
        <h1>
          <a href="/">RSC + MDX + SSG</a>
        </h1>
        <Router />
      </body>
    </html>
  );
}
