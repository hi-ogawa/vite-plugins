export default function Page() {
  return (
    <div className="flex flex-col gap-2 p-2">
      <h3>Test API routes</h3>
      {links.map((href) => (
        <a key={href} className="antd-link" href={href}>
          {href}
        </a>
      ))}
    </div>
  );
}

const links = [
  "/test/api/static",
  "/test/api/dynamic/hello",
  "/test/api/not-found",
];
