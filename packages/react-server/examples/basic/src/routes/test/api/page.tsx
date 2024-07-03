export default function Page() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3>Test API routes</h3>
      {links.map((href) => (
        <a key={href} className="antd-link" href={href}>
          {href}
        </a>
      ))}
      <form method="POST" action="/test/api/context">
        <input
          className="antd-input px-2"
          placeholder="POST /test/api/context"
          name="value"
        />
      </form>
    </div>
  );
}

const links = [
  "/test/api/static",
  "/test/api/dynamic/hello",
  "/test/api/not-found",
  "/test/api/context",
];
