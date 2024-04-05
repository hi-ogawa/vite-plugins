export default async function Page() {
  return (
    <>
      <div id="sidebar" className="flex flex-col gap-4">
        <h1 className="font-bold">Remix Contacts</h1>
        <div className="flex gap-2">
          <form role="search">
            <input
              className="antd-input px-2"
              aria-label="Search contacts"
              name="q"
              placeholder="Search..."
              type="search"
            />
            <div aria-hidden hidden={true} id="search-spinner" />
          </form>
          <form method="post">
            <button className="antd-btn antd-btn-default px-2" type="submit">
              New
            </button>
          </form>
        </div>
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
    </>
  );
}
