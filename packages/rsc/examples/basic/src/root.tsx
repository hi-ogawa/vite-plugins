export function Root() {
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
        <div>hello rsc?</div>
        <script src="/src/entry-client.tsx" type="module" />
      </body>
    </html>
  );
}
