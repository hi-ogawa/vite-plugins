export async function Root() {
  const url = "https://unpkg.com/react@18.2.0/package.json";

  return (
    <html>
      <head>
        <script src="/@vite/client" type="module" />
        <script
          dangerouslySetInnerHTML={{
            __html: /* js*/ `
              self.__webpack_require__ = () => {};
            `,
          }}
        ></script>
      </head>
      <body>
        <div>Hello RSC</div>
        <div>
          <pre>
            fetch({url}) = {(await fetch(url)).text()}
          </pre>
        </div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
