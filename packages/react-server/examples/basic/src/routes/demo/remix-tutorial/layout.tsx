import type { LayoutProps } from "@hiogawa/react-server/server";

export default async function Layout(props: LayoutProps) {
  return (
    <div className="flex flex-col items-center gap-4">
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
      <div className="border p-4 w-full">
        <div className="flex gap-2">
          <SideBar />
          <div className="flex-1 p-2">{props.children}</div>
        </div>
      </div>
    </div>
  );
}

function SideBar() {
  return (
    <div className="flex flex-col p-2 gap-4">
      <h1 className="font-bold">Remix Contacts</h1>
      <div className="flex gap-2">
        <form role="search">
          <input
            className="antd-input p-1"
            aria-label="Search contacts"
            name="q"
            placeholder="Search..."
            type="search"
          />
          <div aria-hidden hidden={true} id="search-spinner" />
        </form>
        <form method="post">
          <button className="antd-btn antd-btn-default p-1 px-2" type="submit">
            New
          </button>
        </form>
      </div>
      <div className="border-t"></div>
      <nav>
        <ul className="flex flex-col gap-2">
          <li className="antd-btn antd-btn-default p-1">
            <a href={`/demo/remix-tutorial/contacts/1`}>Your Name</a>
          </li>
          <li className="antd-btn antd-btn-default p-1">
            <a href={`/demo/remix-tutorial/contacts/2`}>Your Friend</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
