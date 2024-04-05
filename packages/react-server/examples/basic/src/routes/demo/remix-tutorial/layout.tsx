export default async function Layout(props: React.PropsWithChildren) {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* <link rel="styleshee" href={cssHref} /> */}
      <h2 className="text-lg">
        Demo ported from{" "}
        <a
          className="antd-link"
          href="https://github.com/remix-run/remix/blob/b07921efd5e8eed98e2996749852777c71bc3e50/docs/start/tutorial.md"
          target="_blank"
        >
          Remix
        </a>
      </h2>
      <div className="border p-4">{props.children}</div>
    </div>
  );
}
