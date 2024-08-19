import type { PageProps } from "@hiogawa/react-server/server";

export default function Page(props: PageProps) {
  return (
    <div>
      <title>@vercel/og test</title>
      <meta property="og:title" content="test og title" />
      <meta property="og:description" content="test og description" />
      <meta
        property="og:image"
        content={
          props.url.origin +
          "/og?" +
          new URLSearchParams({ title: "@vercel/og test" })
        }
      />
      <ul>
        <li>
          <a href="/og">/og</a>
        </li>
        <li>
          <a href="/og?title=Hello">/og?title=Hello</a>
        </li>
      </ul>
      <form method="GET" action="/og">
        <input name="title" placeholder="Input title..." />
      </form>
    </div>
  );
}
