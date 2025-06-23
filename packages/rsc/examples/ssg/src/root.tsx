export function Root(props: { request: Request }) {
  const url = new URL(props.request.url);
  url.pathname;

  const posts = import.meta.glob("./posts/*.mdx", { eager: true });
  console.log(posts);

  // formatter
  // - title

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RSC MDX SSG</title>
      </head>
      <body>
        <h1>RSC + MDX + SSG</h1>
        <ul>
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
        </ul>
      </body>
    </html>
  );
}
